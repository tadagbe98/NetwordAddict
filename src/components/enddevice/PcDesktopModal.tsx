import React, { useState } from 'react';
import {
  X,
  Maximize2,
  Minimize2,
  Terminal,
  Globe,
  Sliders,
  Send,
  RefreshCw,
  Laptop,
} from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import { executePcCommand } from '../../cli/pcDriver';

export const PcDesktopModal: React.FC = () => {
  const {
    devices,
    activePcId,
    setActivePcId,
    updateDevice,
    injectPing,
    setActiveWebUIId,
  } = useNetwork();

  const [activeTab, setActiveTab] = useState<'cmd' | 'ip' | 'browser' | 'ping'>('cmd');
  const [cmdLines, setCmdLines] = useState<string[]>([
    'Microsoft Windows [Version 10.0.19045.3803]',
    '(c) Microsoft Corporation. Tous droits réservés.',
    '',
    'C:\\Users\\User> ',
  ]);
  const [cmdInput, setCmdInput] = useState('');

  // IP Settings state
  const device = devices.find((d) => d.id === activePcId);
  const cfg = device?.endDeviceConfig;

  const [ipMode, setIpMode] = useState<'static' | 'dhcp'>(cfg?.ipMode || 'static');
  const [ipAddress, setIpAddress] = useState(cfg?.ipAddress || '192.168.1.10');
  const [subnetMask, setSubnetMask] = useState(cfg?.subnetMask || '255.255.255.0');
  const [gateway, setGateway] = useState(cfg?.gateway || '192.168.1.1');
  const [dnsServer, setDnsServer] = useState(cfg?.dnsServer || '8.8.8.8');

  // Virtual Browser
  const [browserUrl, setBrowserUrl] = useState('http://192.168.1.1');
  const [browserContent, setBrowserContent] = useState<string | null>(null);

  // Quick Ping Tool
  const [pingTarget, setPingTarget] = useState('192.168.1.1');

  if (!activePcId || !device) return null;

  const handleCmdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdInput.trim()) return;

    const input = cmdInput;
    setCmdInput('');

    const res = executePcCommand(device, input, (target) => injectPing(device.id, target));

    setCmdLines((prev) => [
      ...prev.slice(0, -1),
      `C:\\Users\\User> ${input}`,
      res.output,
      'C:\\Users\\User> ',
    ]);
  };

  const handleSaveIp = (e: React.FormEvent) => {
    e.preventDefault();
    updateDevice(device.id, {
      endDeviceConfig: {
        ipMode,
        ipAddress,
        subnetMask,
        gateway,
        dnsServer,
      },
    });
    alert('Configuration IP enregistrée !');
  };

  const handleBrowserNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let url = browserUrl.trim();
    if (!url.startsWith('http')) url = 'http://' + url;

    const cleanHost = url.replace(/https?:\/\//, '').replace(/\/.*$/, '');

    // Check if cleanHost is an IP of another device with WebUI (router or switch)
    const matchingDev = devices.find(
      (d) =>
        d.ports.some((p) => p.ipAddress === cleanHost) ||
        d.endDeviceConfig?.ipAddress === cleanHost
    );

    if (matchingDev) {
      if (matchingDev.supportsWebUI) {
        // Open the device WebUI directly
        setActiveWebUIId(matchingDev.id);
        setBrowserContent(`Redirection vers l'interface WebUI de ${matchingDev.name}...`);
        return;
      }
      if (matchingDev.serverServices?.http.enabled) {
        setBrowserContent(matchingDev.serverServices.http.contentHtml);
        return;
      }
    }

    setBrowserContent(`
      <div style="padding: 24px; font-family: sans-serif; text-align: center;">
        <h2 style="color: #ef4444;">Impossible d'accéder au site web</h2>
        <p style="color: #64748b;">L'hôte <strong>${cleanHost}</strong> ne répond pas sur le port HTTP 80.</p>
        <p style="font-size: 12px; color: #94a3b8;">ERR_CONNECTION_TIMED_OUT</p>
      </div>
    `);
  };

  return (
    <div className="fixed z-40 top-16 left-1/2 -translate-x-1/2 w-[720px] h-[520px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn select-none">
      {/* Title Bar */}
      <div className="h-10 bg-slate-950 border-b border-slate-800 px-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-white">
          <Laptop className="w-4 h-4 text-blue-400" />
          <span>Bureau Virtuel — {device.name} ({device.hostname})</span>
        </div>
        <button
          onClick={() => setActivePcId(null)}
          className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* PC App Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex items-center space-x-2 text-xs">
        <button
          onClick={() => setActiveTab('cmd')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-medium transition ${
            activeTab === 'cmd' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Invite CMD</span>
        </button>

        <button
          onClick={() => setActiveTab('ip')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-medium transition ${
            activeTab === 'ip' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Paramètres IP</span>
        </button>

        <button
          onClick={() => setActiveTab('browser')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-medium transition ${
            activeTab === 'browser' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Navigateur Web</span>
        </button>

        <button
          onClick={() => setActiveTab('ping')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-medium transition ${
            activeTab === 'ping' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Test Ping</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden bg-slate-950">
        {/* CMD PROMPT */}
        {activeTab === 'cmd' && (
          <div className="h-full p-3 font-mono text-xs text-slate-100 flex flex-col overflow-y-auto">
            <div className="flex-1 space-y-0.5 whitespace-pre-wrap select-text">
              {cmdLines.slice(0, -1).map((line, idx) => (
                <div key={idx} className="text-slate-300">
                  {line}
                </div>
              ))}
            </div>

            <form onSubmit={handleCmdSubmit} className="flex items-center space-x-1 mt-1">
              <span className="text-white font-bold">C:\Users\User&gt;</span>
              <input
                type="text"
                value={cmdInput}
                onChange={(e) => setCmdInput(e.target.value)}
                autoFocus
                className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-white"
                spellCheck={false}
              />
            </form>
          </div>
        )}

        {/* IP SETTINGS */}
        {activeTab === 'ip' && (
          <form onSubmit={handleSaveIp} className="p-6 max-w-md mx-auto space-y-4 text-xs">
            <div className="flex items-center space-x-4 pb-3 border-b border-slate-800">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="ipmode"
                  checked={ipMode === 'dhcp'}
                  onChange={() => setIpMode('dhcp')}
                  className="accent-blue-500"
                />
                <span className="text-white font-medium">DHCP Automatique</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="ipmode"
                  checked={ipMode === 'static'}
                  onChange={() => setIpMode('static')}
                  className="accent-blue-500"
                />
                <span className="text-white font-medium">IP Statique</span>
              </label>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Adresse IPv4</label>
              <input
                type="text"
                disabled={ipMode === 'dhcp'}
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-white outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Masque de sous-réseau</label>
              <input
                type="text"
                disabled={ipMode === 'dhcp'}
                value={subnetMask}
                onChange={(e) => setSubnetMask(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-white outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Passerelle par défaut (Default Gateway)</label>
              <input
                type="text"
                disabled={ipMode === 'dhcp'}
                value={gateway}
                onChange={(e) => setGateway(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-white outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Serveur DNS</label>
              <input
                type="text"
                disabled={ipMode === 'dhcp'}
                value={dnsServer}
                onChange={(e) => setDnsServer(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-white outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
            >
              Enregistrer la Configuration IP
            </button>
          </form>
        )}

        {/* VIRTUAL BROWSER */}
        {activeTab === 'browser' && (
          <div className="h-full flex flex-col bg-white text-slate-900">
            {/* Address Bar */}
            <form
              onSubmit={handleBrowserNavigate}
              className="p-2 bg-slate-100 border-b border-slate-300 flex items-center space-x-2"
            >
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={browserUrl}
                  onChange={(e) => setBrowserUrl(e.target.value)}
                  placeholder="http://192.168.1.1"
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-1 text-xs text-slate-800 outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-semibold"
              >
                Aller
              </button>
            </form>

            <div className="flex-1 p-4 overflow-y-auto">
              {browserContent ? (
                <div dangerouslySetInnerHTML={{ __html: browserContent }} />
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Globe className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm">Saisissez l'adresse IP d'un routeur, switch ou serveur web pour naviguer.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PING TEST */}
        {activeTab === 'ping' && (
          <div className="p-6 max-w-md mx-auto space-y-4 text-xs">
            <h3 className="text-sm font-bold text-white">Test de Connectivité Graphique (Ping ICMP)</h3>
            <p className="text-slate-400 leading-relaxed">
              Envoie une requête ICMP Echo Request animée à travers les commutateurs et routeurs jusqu'à la destination.
            </p>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Adresse IP Cible</label>
              <input
                type="text"
                value={pingTarget}
                onChange={(e) => setPingTarget(e.target.value)}
                placeholder="192.168.1.1"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-white outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={() => injectPing(device.id, pingTarget)}
              className="w-full flex items-center justify-center space-x-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow transition"
            >
              <Send className="w-4 h-4" />
              <span>Lancer le Ping animé sur le Canvas</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Server, Globe, Database, Radio, Plus, Trash2, Check } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';

export const ServerConfigModal: React.FC = () => {
  const { devices, activeServerId, setActiveServerId, updateDevice } = useNetwork();
  const [tab, setTab] = useState<'http' | 'dns' | 'dhcp'>('http');

  const server = devices.find((d) => d.id === activeServerId);
  const services = server?.serverServices;

  // HTTP Form
  const [httpEnabled, setHttpEnabled] = useState(services?.http.enabled ?? true);
  const [httpTitle, setHttpTitle] = useState(services?.http.title || 'NetSim Enterprise Portal');
  const [httpHtml, setHttpHtml] = useState(
    services?.http.contentHtml ||
      '<h1 style="color: #2563eb;">Portail Intranet Entreprise</h1><p>Services applicatifs opérationnels.</p>'
  );

  // DNS Form
  const [dnsDomain, setDnsDomain] = useState('');
  const [dnsIp, setDnsIp] = useState('');
  const [dnsRecords, setDnsRecords] = useState(
    services?.dns.records || [
      { domain: 'netsim.corp', ip: '192.168.1.100', type: 'A' as const },
      { domain: 'gw.corp', ip: '192.168.1.1', type: 'A' as const },
    ]
  );

  if (!activeServerId || !server || !services) return null;

  const handleSaveHttp = (e: React.FormEvent) => {
    e.preventDefault();
    updateDevice(server.id, {
      serverServices: {
        ...services,
        http: {
          ...services.http,
          enabled: httpEnabled,
          title: httpTitle,
          contentHtml: httpHtml,
        },
      },
    });
    alert('Service HTTP enregistré !');
  };

  const handleAddDnsRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dnsDomain || !dnsIp) return;
    const updated = [...dnsRecords, { domain: dnsDomain, ip: dnsIp, type: 'A' as const }];
    setDnsRecords(updated);
    updateDevice(server.id, {
      serverServices: {
        ...services,
        dns: {
          ...services.dns,
          records: updated,
        },
      },
    });
    setDnsDomain('');
    setDnsIp('');
  };

  const handleDeleteDnsRecord = (idx: number) => {
    const updated = dnsRecords.filter((_, i) => i !== idx);
    setDnsRecords(updated);
    updateDevice(server.id, {
      serverServices: {
        ...services,
        dns: {
          ...services.dns,
          records: updated,
        },
      },
    });
  };

  return (
    <div className="fixed z-40 top-16 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn select-none">
      {/* Title Bar */}
      <div className="h-10 bg-slate-950 border-b border-slate-800 px-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-white">
          <Server className="w-4 h-4 text-indigo-400" />
          <span>Services Réseau — {server.name}</span>
        </div>
        <button
          onClick={() => setActiveServerId(null)}
          className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 py-1.5 flex items-center space-x-2 text-xs">
        <button
          onClick={() => setTab('http')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-medium transition ${
            tab === 'http' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Serveur Web (HTTP)</span>
        </button>

        <button
          onClick={() => setTab('dns')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-medium transition ${
            tab === 'dns' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Serveur DNS</span>
        </button>

        <button
          onClick={() => setTab('dhcp')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-medium transition ${
            tab === 'dhcp' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Serveur DHCP</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 overflow-y-auto bg-slate-950 text-xs">
        {tab === 'http' && (
          <form onSubmit={handleSaveHttp} className="space-y-4 max-w-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="font-bold text-white">Service Web HTTP</div>
                <div className="text-slate-400">Écoute sur le port TCP 80</div>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={httpEnabled}
                  onChange={(e) => setHttpEnabled(e.target.checked)}
                  className="accent-indigo-500 w-4 h-4"
                />
                <span className="text-white font-semibold">Activé</span>
              </label>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Titre de la Page Web</label>
              <input
                type="text"
                value={httpTitle}
                onChange={(e) => setHttpTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Code HTML de la Page d'Accueil (index.html)</label>
              <textarea
                rows={6}
                value={httpHtml}
                onChange={(e) => setHttpHtml(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-white text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow transition"
            >
              Enregistrer le Service Web
            </button>
          </form>
        )}

        {tab === 'dns' && (
          <div className="space-y-4">
            <form onSubmit={handleAddDnsRecord} className="flex items-center space-x-3">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                  Nom de domaine
                </label>
                <input
                  type="text"
                  value={dnsDomain}
                  onChange={(e) => setDnsDomain(e.target.value)}
                  placeholder="portal.corp"
                  required
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono w-40 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                  Adresse IP Cible
                </label>
                <input
                  type="text"
                  value={dnsIp}
                  onChange={(e) => setDnsIp(e.target.value)}
                  placeholder="192.168.1.100"
                  required
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono w-36 outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="mt-5 flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter Enregistrement A</span>
              </button>
            </form>

            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-xs text-left font-mono">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Nom de Domaine</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Adresse IP</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {dnsRecords.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="p-3 text-white font-bold">{r.domain}</td>
                      <td className="p-3 text-indigo-400">{r.type}</td>
                      <td className="p-3 text-emerald-400">{r.ip}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteDnsRecord(i)}
                          className="p-1 text-red-400 hover:bg-red-950/40 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'dhcp' && (
          <div className="space-y-4 max-w-lg">
            <div className="font-bold text-white">Pools DHCP Configurés</div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2 font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Réseau :</span>
                <span className="text-white">192.168.1.0/24</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Passerelle :</span>
                <span className="text-white">192.168.1.1</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>DNS Distribué :</span>
                <span className="text-white">192.168.1.100</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

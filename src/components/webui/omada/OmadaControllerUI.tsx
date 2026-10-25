import React, { useState } from 'react';
import { NetworkDevice } from '../../../types/network';
import {
  LayoutDashboard,
  Server,
  Wifi,
  Users,
  Network,
  Zap,
  CheckCircle,
  Plus,
  RefreshCw,
  Shield,
  Radio,
  Sliders,
} from 'lucide-react';
import { useNetwork } from '../../../context/NetworkContext';

interface OmadaControllerUIProps {
  device: NetworkDevice;
}

export const OmadaControllerUI: React.FC<OmadaControllerUIProps> = ({ device }) => {
  const { devices, updateDevice } = useNetwork();
  const [tab, setTab] = useState<'dashboard' | 'devices' | 'clients' | 'wireless' | 'networks' | 'poe'>('devices');

  // New SSID state
  const [newSsid, setNewSsid] = useState('');
  const [newSsidPass, setNewSsidPass] = useState('Password123');
  const [newSsidVlan, setNewSsidVlan] = useState(1);
  const [ssids, setSsids] = useState<{ id: string; name: string; vlan: number; security: string }[]>([
    { id: '1', name: 'Omada-Corporate', vlan: 1, security: 'WPA2/WPA3 Enterprise' },
    { id: '2', name: 'Omada-Guests', vlan: 20, security: 'WPA2 Personal (Portal)' },
  ]);

  // All Omada devices on canvas
  const omadaHardware = devices.filter((d) => d.vendor === 'omada' && d.model !== 'OC200');

  const handleAdoptDevice = (targetDevId: string) => {
    updateDevice(targetDevId, { omadaAdopted: true, isWebConfigured: true });
    updateDevice(device.id, { isWebConfigured: true });
  };

  const handleAddSsid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSsid.trim()) return;
    setSsids([
      ...ssids,
      {
        id: Date.now().toString(),
        name: newSsid.trim(),
        vlan: newSsidVlan,
        security: 'WPA2/WPA3 Personal',
      },
    ]);
    updateDevice(device.id, { isWebConfigured: true });
    setNewSsid('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0d2238] text-slate-100 font-sans select-none overflow-hidden">
      {/* Omada SDN Topbar */}
      <div className="h-14 bg-[#0a1a2c] border-b border-teal-900/40 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center font-bold text-slate-900 shadow text-xs">
            TP
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center space-x-2">
              <span>TP-Link Omada SDN Controller</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                v5.9.31 Cloud
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Site: <span className="text-teal-400 font-semibold">Default (Corporate HQ)</span> | Statut Cloud : Connecté
            </div>
          </div>
        </div>

        {/* Global Controller Stats */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5 text-teal-400">
            <Server className="w-3.5 h-3.5" />
            <span>Appareils : {omadaHardware.filter((d) => d.omadaAdopted).length}/{omadaHardware.length}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-cyan-400">
            <Radio className="w-3.5 h-3.5" />
            <span>SSIDs actifs : {ssids.length}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Omada Side Menu */}
        <div className="w-52 bg-[#081524] border-r border-teal-900/30 p-2 space-y-1">
          <button
            onClick={() => setTab('dashboard')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              tab === 'dashboard'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-teal-400" />
            <span>Tableau de bord</span>
          </button>

          <button
            onClick={() => setTab('devices')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              tab === 'devices'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4 text-cyan-400" />
            <span>Appareils (Adoption)</span>
          </button>

          <button
            onClick={() => setTab('wireless')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              tab === 'wireless'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Wifi className="w-4 h-4 text-teal-300" />
            <span>Réseaux Wi-Fi (SSID)</span>
          </button>

          <button
            onClick={() => setTab('networks')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              tab === 'networks'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Network className="w-4 h-4 text-blue-400" />
            <span>Réseaux & VLANs</span>
          </button>

          <button
            onClick={() => setTab('poe')}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              tab === 'poe'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Alimentation PoE</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-5 overflow-y-auto bg-[#0a1c2e]/60">
          {/* TAB: DEVICES ADOPTION */}
          {tab === 'devices' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Liste des Appareils Omada Découverts sur le Réseau
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cliquez sur "Adopter" pour intégrer un commutateur, routeur ou point d'accès au contrôleur SDN.
                  </p>
                </div>
              </div>

              <div className="bg-[#0b1e32] rounded-xl border border-teal-900/40 overflow-hidden shadow-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#081524] border-b border-teal-900/40 text-slate-400 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Nom de l'Appareil</th>
                      <th className="p-3">Modèle</th>
                      <th className="p-3">Adresse IP / MAC</th>
                      <th className="p-3">Statut SDN</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-900/30 font-mono">
                    {omadaHardware.map((hw) => {
                      const isAdopted = hw.omadaAdopted;
                      return (
                        <tr key={hw.id} className="hover:bg-teal-950/20">
                          <td className="p-3 font-bold text-white font-sans">{hw.name}</td>
                          <td className="p-3 text-teal-300 font-bold">{hw.model}</td>
                          <td className="p-3 text-slate-400">
                            {hw.ports[0]?.ipAddress || '192.168.0.1'} / {hw.ports[0]?.macAddress}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-sans ${
                                isAdopted
                                  ? 'bg-teal-950 text-teal-300 border border-teal-700'
                                  : 'bg-amber-950 text-amber-300 border border-amber-700'
                              }`}
                            >
                              {isAdopted ? 'Géré (Connecté)' : 'En attente d\'adoption'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {isAdopted ? (
                              <span className="flex items-center justify-end space-x-1 text-teal-400 text-xs font-semibold font-sans">
                                <CheckCircle className="w-4 h-4" />
                                <span>Adopté</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleAdoptDevice(hw.id)}
                                className="px-3 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs transition shadow-md font-sans"
                              >
                                Adopter
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {omadaHardware.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-400 font-sans">
                          Aucun équipement TP-Link Omada (ER605, SG2008P, EAP650...) sur le canvas.
                          Ajoutez-en depuis la barre latérale gauche !
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: WIRELESS SSIDS */}
          {tab === 'wireless' && (
            <div className="space-y-4">
              {/* Add SSID Form */}
              <form
                onSubmit={handleAddSsid}
                className="bg-[#0b1e32] p-4 rounded-xl border border-teal-900/40 flex items-center space-x-3 text-xs"
              >
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Nom du Réseau Sans-Fil (SSID)
                  </label>
                  <input
                    type="text"
                    value={newSsid}
                    onChange={(e) => setNewSsid(e.target.value)}
                    placeholder="Campus-Pro"
                    required
                    className="bg-[#071321] border border-teal-900/60 rounded-lg px-3 py-1.5 text-white font-mono w-44 outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    VLAN Associé
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={4094}
                    value={newSsidVlan}
                    onChange={(e) => setNewSsidVlan(parseInt(e.target.value, 10))}
                    className="bg-[#071321] border border-teal-900/60 rounded-lg px-3 py-1.5 text-white font-mono w-24 outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Mot de passe WPA2/WPA3
                  </label>
                  <input
                    type="password"
                    value={newSsidPass}
                    onChange={(e) => setNewSsidPass(e.target.value)}
                    className="bg-[#071321] border border-teal-900/60 rounded-lg px-3 py-1.5 text-white font-mono w-36 outline-none focus:border-teal-400"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-5 flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Créer SSID</span>
                </button>
              </form>

              {/* SSIDs Table */}
              <div className="bg-[#0b1e32] rounded-xl border border-teal-900/40 overflow-hidden shadow-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#081524] border-b border-teal-900/40 text-slate-400 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Nom SSID</th>
                      <th className="p-3">Bande Fréquence</th>
                      <th className="p-3">VLAN ID</th>
                      <th className="p-3">Sécurité</th>
                      <th className="p-3">Points d'accès diffusant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-teal-900/30">
                    {ssids.map((s) => (
                      <tr key={s.id} className="hover:bg-teal-950/20">
                        <td className="p-3 font-bold text-white flex items-center space-x-2">
                          <Wifi className="w-4 h-4 text-teal-400" />
                          <span>{s.name}</span>
                        </td>
                        <td className="p-3 text-slate-300">2.4 GHz + 5 GHz (Dual Band)</td>
                        <td className="p-3 text-cyan-400 font-mono font-bold">VLAN {s.vlan}</td>
                        <td className="p-3 text-slate-300">{s.security}</td>
                        <td className="p-3 text-slate-400 font-mono">Tous les APs du site (EAP650)</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: DASHBOARD */}
          {tab === 'dashboard' && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-[#0b1e32] p-4 rounded-xl border border-teal-900/40">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Passerelle SDN</div>
                  <div className="text-xl font-bold text-white mt-1">Connectée</div>
                  <div className="text-xs text-teal-400 mt-1">ER605 Gigabit VPN</div>
                </div>
                <div className="bg-[#0b1e32] p-4 rounded-xl border border-teal-900/40">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Switchs Managés</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {omadaHardware.filter((d) => d.category === 'switch' && d.omadaAdopted).length} Actif(s)
                  </div>
                  <div className="text-xs text-cyan-400 mt-1">SG2008P / SG3428</div>
                </div>
                <div className="bg-[#0b1e32] p-4 rounded-xl border border-teal-900/40">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Points d'accès Wi-Fi</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {omadaHardware.filter((d) => d.category === 'wlan' && d.omadaAdopted).length} En ligne
                  </div>
                  <div className="text-xs text-emerald-400 mt-1">EAP650 Wi-Fi 6</div>
                </div>
                <div className="bg-[#0b1e32] p-4 rounded-xl border border-teal-900/40">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Santé Réseau</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">100% EXCELLENTE</div>
                  <div className="text-xs text-slate-400 mt-1">0 paquet d'erreur</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: POE MANAGEMENT */}
          {tab === 'poe' && (
            <div className="bg-[#0b1e32] p-5 rounded-xl border border-teal-900/40 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Gestion de l'alimentation PoE Switch</h3>
                  <p className="text-xs text-slate-400">
                    Alimentation des caméras IP et points d'accès via le câble Ethernet (802.3af/at).
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-mono">Budget PoE Total : 62.0 W</div>
                  <div className="text-sm font-bold text-teal-400 font-mono">Consommation : 15.4 W (24%)</div>
                </div>
              </div>

              <div className="w-full bg-[#071321] h-3 rounded-full overflow-hidden border border-teal-900/60">
                <div className="bg-gradient-to-r from-teal-500 to-amber-400 h-full w-[24%]" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

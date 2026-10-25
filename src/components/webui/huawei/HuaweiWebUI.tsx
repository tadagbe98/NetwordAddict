import React, { useState } from 'react';
import { NetworkDevice, NetworkPort, VlanConfig, StaticRoute } from '../../../types/network';
import {
  Activity,
  Server,
  Layers,
  Compass,
  Database,
  Save,
  Check,
  Plus,
  Trash2,
  Cpu,
} from 'lucide-react';
import { useNetwork } from '../../../context/NetworkContext';

interface HuaweiWebUIProps {
  device: NetworkDevice;
}

export const HuaweiWebUI: React.FC<HuaweiWebUIProps> = ({ device }) => {
  const { updateDevice } = useNetwork();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'interfaces' | 'vlans' | 'routing' | 'dhcp'>('dashboard');

  // Form states
  const [newVlanId, setNewVlanId] = useState('');
  const [newVlanName, setNewVlanName] = useState('');
  const [routeDest, setRouteDest] = useState('');
  const [routeMask, setRouteMask] = useState('255.255.255.0');
  const [routeNextHop, setRouteNextHop] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Interfaces editing
  const [editingPortId, setEditingPortId] = useState<string | null>(null);
  const [portIp, setPortIp] = useState('');
  const [portMask, setPortMask] = useState('255.255.255.0');
  const [portVlanMode, setPortVlanMode] = useState<'access' | 'trunk'>('access');
  const [portVlanId, setPortVlanId] = useState(1);

  const handleSaveToStartup = () => {
    device.savedConfigText = device.configText;
    updateDevice(device.id, { isWebConfigured: true });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleAddVlan = (e: React.FormEvent) => {
    e.preventDefault();
    const vid = parseInt(newVlanId, 10);
    if (isNaN(vid) || vid < 1 || vid > 4094) return;
    if (device.vlans.some((v) => v.id === vid)) return;

    const updatedVlans = [
      ...device.vlans,
      { id: vid, name: newVlanName || `VLAN${vid}`, isUp: true },
    ];
    updateDevice(device.id, { vlans: updatedVlans, isWebConfigured: true });
    setNewVlanId('');
    setNewVlanName('');
  };

  const handleDeleteVlan = (vid: number) => {
    if (vid === 1) return; // default VLAN cannot be deleted
    const updatedVlans = device.vlans.filter((v) => v.id !== vid);
    updateDevice(device.id, { vlans: updatedVlans });
  };

  const handleAddRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeDest || !routeNextHop) return;
    const newRoute: StaticRoute = {
      id: 'rt-' + Math.random().toString(36).substring(2, 7),
      destination: routeDest,
      mask: routeMask,
      nextHop: routeNextHop,
      preference: 60,
    };
    updateDevice(device.id, { routes: [...device.routes, newRoute], isWebConfigured: true });
    setRouteDest('');
    setRouteNextHop('');
  };

  const handleSavePort = (portId: string) => {
    const updatedPorts = device.ports.map((p) => {
      if (p.id === portId) {
        return {
          ...p,
          ipAddress: portIp || undefined,
          subnetMask: portIp ? portMask : undefined,
          vlanMode: portVlanMode,
          accessVlan: portVlanId,
        };
      }
      return p;
    });
    updateDevice(device.id, { ports: updatedPorts, isWebConfigured: true });
    setEditingPortId(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 font-sans select-none overflow-hidden">
      {/* Huawei Easy-Web Header */}
      <div className="h-14 bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 border-b border-red-900/40 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center font-bold text-white shadow-md text-xs">
            HW
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center space-x-2">
              <span>Huawei Easy-Web Management</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                {device.model}
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Hostname: {device.hostname} | VRP v5.170
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Quick CPU/RAM Gauges */}
          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-950/60 px-3 py-1 rounded-lg border border-slate-800">
            <Cpu className="w-3.5 h-3.5 text-red-400" />
            <span>CPU: 8%</span>
            <span className="text-slate-600">|</span>
            <span>RAM: 32%</span>
          </div>

          <button
            onClick={handleSaveToStartup}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-md transition"
          >
            {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'Enregistré !' : 'Sauvegarder'}</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Tabs Sidebar */}
        <div className="w-48 bg-slate-950 border-r border-slate-800 p-2 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'dashboard'
                ? 'bg-red-950/60 text-red-300 border border-red-900/50'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4 text-red-400" />
            <span>Tableau de bord</span>
          </button>

          <button
            onClick={() => setActiveTab('interfaces')}
            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'interfaces'
                ? 'bg-red-950/60 text-red-300 border border-red-900/50'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Interfaces & Ports</span>
          </button>

          <button
            onClick={() => setActiveTab('vlans')}
            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'vlans'
                ? 'bg-red-950/60 text-red-300 border border-red-900/50'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Gestion des VLANs</span>
          </button>

          <button
            onClick={() => setActiveTab('routing')}
            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'routing'
                ? 'bg-red-950/60 text-red-300 border border-red-900/50'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4 text-purple-400" />
            <span>Routage Statique</span>
          </button>

          <button
            onClick={() => setActiveTab('dhcp')}
            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'dhcp'
                ? 'bg-red-950/60 text-red-300 border border-red-900/50'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4 text-amber-400" />
            <span>Serveur DHCP</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-5 overflow-y-auto bg-slate-900/50">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Panneau Physique du Châssis (Vue Façade)
                </h3>
                <div className="grid grid-cols-6 gap-2">
                  {device.ports.map((port) => (
                    <div
                      key={port.id}
                      className={`p-2.5 rounded-lg border text-center transition ${
                        port.isUp
                          ? 'bg-emerald-950/30 border-emerald-500/50'
                          : 'bg-slate-900/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-1 mb-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            port.isUp
                              ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse'
                              : 'bg-slate-600'
                          }`}
                        />
                        <span className="text-[10px] font-mono text-slate-300 font-bold">{port.name}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-mono">
                        {port.isUp ? `${port.speed}M Full` : 'Non connecté'}
                      </div>
                      <div className="text-[9px] text-blue-400 font-mono mt-0.5">
                        {port.vlanMode === 'access' ? `VLAN ${port.accessVlan}` : 'Trunk'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-white mb-2">Informations Système</div>
                  <div className="flex justify-between text-slate-400">
                    <span>Constructeur :</span>
                    <span className="text-white font-medium">Huawei Technologies Co., Ltd.</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Modèle :</span>
                    <span className="text-white font-medium">{device.model}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Système d'exploitation :</span>
                    <span className="text-white font-medium">VRP Version 5.170 (V200R019C00)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Nombre de VLANs :</span>
                    <span className="text-red-400 font-bold">{device.vlans.length}</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-white mb-2">Synchronisation État Réseau</div>
                  <p className="text-slate-400 leading-relaxed">
                    Toute modification réalisée ici sur les VLANs, ports ou routes statiques est
                    instantanément synchronisée avec la CLI Huawei VRP (et inversement).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERFACES */}
          {activeTab === 'interfaces' && (
            <div className="space-y-4">
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Interface</th>
                      <th className="p-3">Statut</th>
                      <th className="p-3">Adresse IP</th>
                      <th className="p-3">Masque</th>
                      <th className="p-3">Mode VLAN</th>
                      <th className="p-3">VLAN ID</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {device.ports.map((port) => {
                      const isEditing = editingPortId === port.id;
                      return (
                        <tr key={port.id} className="hover:bg-slate-900/60">
                          <td className="p-3 font-bold text-white">{port.name}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                port.isUp
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {port.isUp ? 'UP' : 'DOWN'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300">
                            {isEditing ? (
                              <input
                                type="text"
                                value={portIp}
                                onChange={(e) => setPortIp(e.target.value)}
                                placeholder="192.168.1.1"
                                className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-xs text-white"
                              />
                            ) : (
                              port.ipAddress || '-'
                            )}
                          </td>
                          <td className="p-3 text-slate-400">
                            {isEditing ? (
                              <input
                                type="text"
                                value={portMask}
                                onChange={(e) => setPortMask(e.target.value)}
                                className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-xs text-white"
                              />
                            ) : (
                              port.subnetMask || '-'
                            )}
                          </td>
                          <td className="p-3">
                            {isEditing ? (
                              <select
                                value={portVlanMode}
                                onChange={(e) => setPortVlanMode(e.target.value as any)}
                                className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-xs text-white"
                              >
                                <option value="access">Access</option>
                                <option value="trunk">Trunk</option>
                              </select>
                            ) : (
                              <span className="capitalize">{port.vlanMode}</span>
                            )}
                          </td>
                          <td className="p-3 text-blue-400">
                            {isEditing ? (
                              <input
                                type="number"
                                min={1}
                                max={4094}
                                value={portVlanId}
                                onChange={(e) => setPortVlanId(parseInt(e.target.value, 10))}
                                className="bg-slate-900 border border-slate-700 px-2 py-1 rounded text-xs text-white w-16"
                              />
                            ) : (
                              port.accessVlan
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {isEditing ? (
                              <button
                                onClick={() => handleSavePort(port.id)}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-semibold"
                              >
                                Valider
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingPortId(port.id);
                                  setPortIp(port.ipAddress || '');
                                  setPortMask(port.subnetMask || '255.255.255.0');
                                  setPortVlanMode(port.vlanMode === 'trunk' ? 'trunk' : 'access');
                                  setPortVlanId(port.accessVlan);
                                }}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-sans text-xs"
                              >
                                Configurer
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: VLANS */}
          {activeTab === 'vlans' && (
            <div className="space-y-4">
              {/* Add VLAN Form */}
              <form
                onSubmit={handleAddVlan}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center space-x-3 text-xs"
              >
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    VLAN ID (1-4094)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={4094}
                    value={newVlanId}
                    onChange={(e) => setNewVlanId(e.target.value)}
                    placeholder="10"
                    required
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono w-28 focus:border-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Nom du VLAN
                  </label>
                  <input
                    type="text"
                    value={newVlanName}
                    onChange={(e) => setNewVlanName(e.target.value)}
                    placeholder="Comptabilite"
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white w-44 focus:border-red-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-5 flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Créer VLAN</span>
                </button>
              </form>

              {/* VLANs Table */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">VLAN ID</th>
                      <th className="p-3">Nom</th>
                      <th className="p-3">Interface Vlanif IP</th>
                      <th className="p-3">Ports Membres</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {device.vlans.map((v) => {
                      const memberPorts = device.ports
                        .filter((p) => p.accessVlan === v.id || p.trunkAllowedVlans.includes(v.id))
                        .map((p) => p.name)
                        .join(', ');
                      return (
                        <tr key={v.id} className="hover:bg-slate-900/60">
                          <td className="p-3 font-bold text-red-400">{v.id}</td>
                          <td className="p-3 font-sans text-white">{v.name}</td>
                          <td className="p-3 text-slate-400">{v.ipAddress ? `${v.ipAddress}/24` : '-'}</td>
                          <td className="p-3 text-slate-300">{memberPorts || 'Aucun'}</td>
                          <td className="p-3 text-right">
                            {v.id !== 1 && (
                              <button
                                onClick={() => handleDeleteVlan(v.id)}
                                className="p-1 rounded text-red-400 hover:bg-red-950/60 transition"
                                title="Supprimer le VLAN"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ROUTING */}
          {activeTab === 'routing' && (
            <div className="space-y-4">
              <form
                onSubmit={handleAddRoute}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center space-x-3 text-xs"
              >
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Réseau Cible
                  </label>
                  <input
                    type="text"
                    value={routeDest}
                    onChange={(e) => setRouteDest(e.target.value)}
                    placeholder="192.168.20.0"
                    required
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono w-36 outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Masque
                  </label>
                  <input
                    type="text"
                    value={routeMask}
                    onChange={(e) => setRouteMask(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono w-36 outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Prochain Saut (Next-Hop)
                  </label>
                  <input
                    type="text"
                    value={routeNextHop}
                    onChange={(e) => setRouteNextHop(e.target.value)}
                    placeholder="192.168.1.254"
                    required
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono w-36 outline-none focus:border-red-500"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-5 flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter Route</span>
                </button>
              </form>

              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-xs text-left font-mono">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] font-sans">
                    <tr>
                      <th className="p-3">Destination</th>
                      <th className="p-3">Masque</th>
                      <th className="p-3">Next-Hop</th>
                      <th className="p-3">Préférence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {device.routes.map((rt) => (
                      <tr key={rt.id} className="hover:bg-slate-900/60">
                        <td className="p-3 text-white font-bold">{rt.destination}</td>
                        <td className="p-3 text-slate-400">{rt.mask}</td>
                        <td className="p-3 text-purple-400">{rt.nextHop}</td>
                        <td className="p-3 text-slate-400">{rt.preference || 60}</td>
                      </tr>
                    ))}
                    {device.routes.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-500 font-sans">
                          Aucune route statique configurée.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: DHCP */}
          {activeTab === 'dhcp' && (
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4 text-xs">
              <h3 className="text-sm font-bold text-white">Serveur DHCP Local (Huawei IP Pool)</h3>
              <p className="text-slate-400">
                Configurez l'allocation dynamique des adresses IP pour les équipements clients du réseau local.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Réseau du Pool</label>
                  <input
                    type="text"
                    defaultValue="192.168.1.0"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-semibold mb-1">Passerelle par défaut</label>
                  <input
                    type="text"
                    defaultValue="192.168.1.1"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { NetworkDevice, StaticRoute } from '../../../types/network';
import {
  Activity,
  Layers,
  Compass,
  Server,
  Save,
  Check,
  Plus,
  Trash2,
  Shield,
} from 'lucide-react';
import { useNetwork } from '../../../context/NetworkContext';

interface CiscoWebUIProps {
  device: NetworkDevice;
}

export const CiscoWebUI: React.FC<CiscoWebUIProps> = ({ device }) => {
  const { updateDevice } = useNetwork();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'interfaces' | 'vlans' | 'routing'>('dashboard');

  const [newVlanId, setNewVlanId] = useState('');
  const [newVlanName, setNewVlanName] = useState('');
  const [routeDest, setRouteDest] = useState('');
  const [routeMask, setRouteMask] = useState('255.255.255.0');
  const [routeNextHop, setRouteNextHop] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Interface editing
  const [editingPortId, setEditingPortId] = useState<string | null>(null);
  const [portIp, setPortIp] = useState('');
  const [portMask, setPortMask] = useState('255.255.255.0');
  const [portVlanMode, setPortVlanMode] = useState<'access' | 'trunk'>('access');
  const [portVlanId, setPortVlanId] = useState(1);

  const handleSaveConfig = () => {
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

    const updated = [...device.vlans, { id: vid, name: newVlanName || `VLAN${vid}`, isUp: true }];
    updateDevice(device.id, { vlans: updated, isWebConfigured: true });
    setNewVlanId('');
    setNewVlanName('');
  };

  const handleDeleteVlan = (vid: number) => {
    if (vid === 1) return;
    updateDevice(device.id, { vlans: device.vlans.filter((v) => v.id !== vid) });
  };

  const handleAddRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeDest || !routeNextHop) return;
    const newRoute: StaticRoute = {
      id: 'rt-' + Math.random().toString(36).substring(2, 7),
      destination: routeDest,
      mask: routeMask,
      nextHop: routeNextHop,
      preference: 1,
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
      {/* Cisco IOS-XE Header */}
      <div className="h-14 bg-gradient-to-r from-sky-950 via-slate-900 to-slate-900 border-b border-sky-900/50 px-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded bg-[#005073] flex items-center justify-center font-bold text-white shadow text-xs">
            CISCO
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center space-x-2">
              <span>Cisco IOS-XE Web User Interface</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {device.model}
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Hostname: {device.hostname} | Cisco IOS-XE 16.9.4
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSaveConfig}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#005073] hover:bg-sky-700 text-white shadow transition"
          >
            {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? 'Configuration Sauvegardée !' : 'Save to Startup'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="w-48 bg-slate-950 border-r border-slate-800 p-2 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'dashboard'
                ? 'bg-sky-950/60 text-sky-300 border border-sky-800/50'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4 text-sky-400" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('interfaces')}
            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'interfaces'
                ? 'bg-sky-950/60 text-sky-300 border border-sky-800/50'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Port Management</span>
          </button>

          <button
            onClick={() => setActiveTab('vlans')}
            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'vlans'
                ? 'bg-sky-950/60 text-sky-300 border border-sky-800/50'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>VLAN Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('routing')}
            className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
              activeTab === 'routing'
                ? 'bg-sky-950/60 text-sky-300 border border-sky-800/50'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4 text-purple-400" />
            <span>Static Routing</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-5 overflow-y-auto bg-slate-900/50">
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Cisco Front Panel Port Matrix
                </h3>
                <div className="grid grid-cols-6 gap-2">
                  {device.ports.map((port) => (
                    <div
                      key={port.id}
                      className={`p-2.5 rounded-lg border text-center ${
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
                        {port.isUp ? `${port.speed} Mbps` : 'Down'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="font-bold text-white mb-2">Device Summary</div>
                <div className="flex justify-between text-slate-400">
                  <span>Vendor:</span>
                  <span className="text-white">Cisco Systems, Inc.</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Chassis:</span>
                  <span className="text-white">{device.model}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>OS Version:</span>
                  <span className="text-white">Cisco IOS-XE Fuji 16.9.4</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'interfaces' && (
            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Port</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Mode</th>
                    <th className="p-3">VLAN</th>
                    <th className="p-3 text-right">Action</th>
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
                              port.isUp ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
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
                        <td className="p-3 text-cyan-400">
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
                              className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-sans text-xs font-semibold"
                            >
                              Save
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
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'vlans' && (
            <div className="space-y-4">
              <form
                onSubmit={handleAddVlan}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center space-x-3 text-xs"
              >
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    VLAN ID
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={4094}
                    value={newVlanId}
                    onChange={(e) => setNewVlanId(e.target.value)}
                    placeholder="20"
                    required
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono w-28 outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    VLAN Name
                  </label>
                  <input
                    type="text"
                    value={newVlanName}
                    onChange={(e) => setNewVlanName(e.target.value)}
                    placeholder="Servers"
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white w-44 outline-none focus:border-sky-500"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-5 flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create VLAN</span>
                </button>
              </form>

              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">VLAN ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Assigned Ports</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {device.vlans.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-900/60">
                        <td className="p-3 text-sky-400 font-bold">{v.id}</td>
                        <td className="p-3 font-sans text-white">{v.name}</td>
                        <td className="p-3 text-slate-400">
                          {device.ports
                            .filter((p) => p.accessVlan === v.id || p.trunkAllowedVlans.includes(v.id))
                            .map((p) => p.name)
                            .join(', ') || 'None'}
                        </td>
                        <td className="p-3 text-right">
                          {v.id !== 1 && (
                            <button
                              onClick={() => handleDeleteVlan(v.id)}
                              className="p-1 rounded text-red-400 hover:bg-red-950/60 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'routing' && (
            <div className="space-y-4">
              <form
                onSubmit={handleAddRoute}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center space-x-3 text-xs"
              >
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Prefix / Network
                  </label>
                  <input
                    type="text"
                    value={routeDest}
                    onChange={(e) => setRouteDest(e.target.value)}
                    placeholder="10.0.0.0"
                    required
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono w-36 outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Subnet Mask
                  </label>
                  <input
                    type="text"
                    value={routeMask}
                    onChange={(e) => setRouteMask(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono w-36 outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Next-Hop IP
                  </label>
                  <input
                    type="text"
                    value={routeNextHop}
                    onChange={(e) => setRouteNextHop(e.target.value)}
                    placeholder="192.168.1.1"
                    required
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono w-36 outline-none focus:border-sky-500"
                  />
                </div>
                <button
                  type="submit"
                  className="mt-5 flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Route</span>
                </button>
              </form>

              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-xs text-left font-mono">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] font-sans">
                    <tr>
                      <th className="p-3">Network Destination</th>
                      <th className="p-3">Subnet Mask</th>
                      <th className="p-3">Gateway / Next-Hop</th>
                      <th className="p-3">Admin Distance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {device.routes.map((rt) => (
                      <tr key={rt.id} className="hover:bg-slate-900/60">
                        <td className="p-3 text-white font-bold">{rt.destination}</td>
                        <td className="p-3 text-slate-400">{rt.mask}</td>
                        <td className="p-3 text-sky-400">{rt.nextHop}</td>
                        <td className="p-3 text-slate-400">{rt.preference || 1}</td>
                      </tr>
                    ))}
                    {device.routes.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-500 font-sans">
                          No static routes configured.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

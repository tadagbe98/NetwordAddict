import React, { useState } from 'react';
import { X, Layers, Cpu, Compass, FileText, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';

export const PacketInspectorModal: React.FC = () => {
  const { inspectedPacket, setInspectedPacket } = useNetwork();
  const [activeTab, setActiveTab] = useState<'headers' | 'steps' | 'raw'>('headers');

  if (!inspectedPacket) return null;

  return (
    <div className="fixed z-50 top-16 left-1/2 -translate-x-1/2 w-[760px] max-h-[580px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn select-none">
      {/* Title Bar */}
      <div className="h-10 bg-slate-950 border-b border-slate-800 px-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-white">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Inspecteur de Trame Réseau (Wireshark-Light) — {inspectedPacket.type.toUpperCase()}</span>
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: inspectedPacket.color }}
          />
        </div>
        <button
          onClick={() => setInspectedPacket(null)}
          className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation tabs */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 py-1 flex items-center space-x-2 text-xs">
        <button
          onClick={() => setActiveTab('headers')}
          className={`px-3 py-1 rounded-md font-medium transition ${
            activeTab === 'headers' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          En-têtes Protocolaires (L1 - L4)
        </button>
        <button
          onClick={() => setActiveTab('steps')}
          className={`px-3 py-1 rounded-md font-medium transition ${
            activeTab === 'steps' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          Historique des Décisions Matérielles ({inspectedPacket.steps.length} sauts)
        </button>
        <button
          onClick={() => setActiveTab('raw')}
          className={`px-3 py-1 rounded-md font-medium transition ${
            activeTab === 'raw' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          Charge Utile (Hex / Payload)
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto bg-slate-950 text-xs">
        {/* TAB 1: PROTOCOL HEADERS */}
        {activeTab === 'headers' && (
          <div className="space-y-3 font-mono">
            {/* L2 Ethernet II */}
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-blue-400 font-bold mb-2 font-sans">
                <span className="flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Trame Ethernet II (Couche 2 Liaison)</span>
                </span>
                <span className="text-[10px] bg-blue-950/70 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800">
                  MAC
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>Destination MAC : <span className="text-white font-bold">{inspectedPacket.dstMac}</span></div>
                <div>Source MAC : <span className="text-white font-bold">{inspectedPacket.srcMac}</span></div>
                <div>Type : <span className="text-emerald-400">0x0800 (IPv4)</span></div>
                <div>VLAN Tag (802.1Q) : <span className="text-purple-400">{inspectedPacket.vlanId ? `VLAN ${inspectedPacket.vlanId}` : 'Untagged (VLAN 1)'}</span></div>
              </div>
            </div>

            {/* L3 IPv4 */}
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-emerald-400 font-bold mb-2 font-sans">
                <span className="flex items-center space-x-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Paquet Internet Protocol Version 4 (Couche 3 Réseau)</span>
                </span>
                <span className="text-[10px] bg-emerald-950/70 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800">
                  IP
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>Source IP : <span className="text-white font-bold">{inspectedPacket.srcIp}</span></div>
                <div>Destination IP : <span className="text-white font-bold">{inspectedPacket.dstIp}</span></div>
                <div>TTL (Time to Live) : <span className="text-amber-400">64</span></div>
                <div>Protocole : <span className="text-emerald-400">ICMP (1)</span></div>
              </div>
            </div>

            {/* L4 ICMP */}
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-purple-400 font-bold mb-2 font-sans">
                <span className="flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Internet Control Message Protocol (ICMP)</span>
                </span>
                <span className="text-[10px] bg-purple-950/70 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800">
                  Control
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>Type : <span className="text-white">{inspectedPacket.type === 'icmp_echo' ? '8 (Echo Request)' : '0 (Echo Reply)'}</span></div>
                <div>Code : <span className="text-white">0</span></div>
                <div>Checksum : <span className="text-emerald-400">0x4a2f (Correct)</span></div>
                <div>Numéro de séquence : <span className="text-white">1</span></div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STEP HISTORY */}
        {activeTab === 'steps' && (
          <div className="space-y-2">
            {inspectedPacket.steps.map((step, idx) => (
              <div
                key={idx}
                className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-start space-x-3"
              >
                <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 font-bold font-mono flex items-center justify-center text-xs shrink-0 mt-0.5">
                  {step.stepIndex}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">
                      {step.deviceName} ({step.portName})
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        step.action === 'DROPPED'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : step.action === 'ROUTED'
                          ? 'bg-purple-950 text-purple-400 border border-purple-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {step.layer} : {step.action}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs mt-1 leading-relaxed font-sans">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: RAW PAYLOAD */}
        {activeTab === 'raw' && (
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-slate-300 text-xs">
            <div className="text-slate-500 mb-2">// 32 bytes of ASCII ICMP payload data :</div>
            <pre className="whitespace-pre-wrap">{JSON.stringify(inspectedPacket.payload, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

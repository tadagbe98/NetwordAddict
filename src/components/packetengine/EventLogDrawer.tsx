import React, { useState } from 'react';
import { X, Trash2, ListFilter, Activity, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';

export const EventLogDrawer: React.FC = () => {
  const {
    isEventLogOpen,
    setIsEventLogOpen,
    events,
    packets,
    setInspectedPacket,
  } = useNetwork();

  const [filter, setFilter] = useState<string>('ALL');

  if (!isEventLogOpen) return null;

  const filtered = events.filter((e) => {
    if (filter === 'ALL') return true;
    return e.type === filter;
  });

  return (
    <div className="fixed bottom-0 right-0 z-30 w-[500px] h-[340px] bg-slate-900 border-t border-l border-slate-700/80 rounded-tl-2xl shadow-2xl flex flex-col overflow-hidden animate-slideUp select-none">
      {/* Title Bar */}
      <div className="h-10 bg-slate-950 border-b border-slate-800 px-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-white">
          <Activity className="w-4 h-4 text-blue-400" />
          <span>Journal des Événements & Trames ({events.length})</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Filters */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[11px] text-slate-300 outline-none"
          >
            <option value="ALL">Tous les types</option>
            <option value="PACKET">Trames & Paquets</option>
            <option value="SUCCESS">Succès</option>
            <option value="WARNING">Avertissements</option>
            <option value="ERROR">Erreurs</option>
          </select>

          <button
            onClick={() => setIsEventLogOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 text-xs font-mono">
        {filtered.map((evt) => {
          const matchingPacket = evt.packetId
            ? packets.find((p) => p.id === evt.packetId)
            : null;

          return (
            <div
              key={evt.id}
              onClick={() => {
                if (matchingPacket) setInspectedPacket(matchingPacket);
              }}
              className={`p-2 rounded-lg border transition ${
                matchingPacket ? 'cursor-pointer hover:border-blue-500/80 hover:bg-slate-800/60' : ''
              } ${
                evt.type === 'ERROR'
                  ? 'bg-red-950/30 border-red-900/50 text-red-300'
                  : evt.type === 'WARNING'
                  ? 'bg-amber-950/30 border-amber-900/50 text-amber-300'
                  : evt.type === 'SUCCESS'
                  ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-300'
                  : evt.type === 'PACKET'
                  ? 'bg-blue-950/30 border-blue-900/50 text-blue-300'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                <span>{evt.timestamp}</span>
                <span className="font-bold uppercase tracking-wider">{evt.sourceName}</span>
              </div>
              <div className="text-xs leading-tight font-sans font-medium">{evt.message}</div>
              {matchingPacket && (
                <div className="text-[10px] text-blue-400 mt-1 flex items-center space-x-1 font-sans">
                  <span>➜ Cliquez pour inspecter la trame dans Wireshark</span>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-500 font-sans">
            Aucun événement enregistré. Activez la simulation ou lancez un ping pour générer du trafic.
          </div>
        )}
      </div>
    </div>
  );
};

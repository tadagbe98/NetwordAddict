import React from 'react';
import { Cable, Shield, Sun, Home, Sliders, CheckCircle2 } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import { useI18n } from '../../context/I18nContext';
import { CABLE_SPECS } from '../../constants/cables';
import { CableType } from '../../types/network';

export const CableSelector: React.FC = () => {
  const {
    mode,
    selectedCableType,
    setSelectedCableType,
    selectedCableEnv,
    setSelectedCableEnv,
    selectedCableLength,
    setSelectedCableLength,
  } = useNetwork();
  const { t } = useI18n();

  if (mode !== 'cable') return null;

  const cableTypes: CableType[] = [
    'straight',
    'crossover',
    'cat5',
    'cat6',
    'cat6a',
    'sftp',
    'fiber',
    'sfp',
    'console',
    'serial',
  ];

  const currentSpec = CABLE_SPECS[selectedCableType];

  return (
    <div className="absolute top-16 left-76 z-20 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-xl max-w-lg w-full animate-fadeIn select-none">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
        <div className="flex items-center space-x-2">
          <Cable className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            {t.sidebar.cables}
          </span>
        </div>

        {/* Environment toggle */}
        <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setSelectedCableEnv('indoor')}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium transition ${
              selectedCableEnv === 'indoor'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-3 h-3" />
            <span>{t.sidebar.indoor}</span>
          </button>
          <button
            onClick={() => setSelectedCableEnv('outdoor')}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium transition ${
              selectedCableEnv === 'outdoor'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-3 h-3" />
            <span>{t.sidebar.outdoor}</span>
          </button>
        </div>
      </div>

      {/* Grid of cable types */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {cableTypes.map((type) => {
          const spec = CABLE_SPECS[type];
          const isSelected = selectedCableType === type;
          return (
            <button
              key={type}
              onClick={() => setSelectedCableType(type)}
              className={`flex items-center space-x-2 p-1.5 rounded-lg border text-left text-xs transition ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-950/40 text-white font-medium ring-1 ring-emerald-500/50'
                  : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full shrink-0 border border-black/40"
                style={{ backgroundColor: spec.color }}
              />
              <span className="truncate">{spec.name}</span>
            </button>
          );
        })}
      </div>

      {/* Cable specs detail & length slider */}
      <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800 text-xs">
        <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
          <span style={{ color: currentSpec.color }}>{currentSpec.name}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            Max: {currentSpec.maxSpeedMbps >= 1000 ? `${currentSpec.maxSpeedMbps / 1000} Gbps` : `${currentSpec.maxSpeedMbps} Mbps`} | {currentSpec.maxDistanceMeters}m
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight mb-2.5">{currentSpec.description}</p>

        {/* Length Slider */}
        <div className="flex items-center space-x-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
            <Sliders className="w-3 h-3 text-blue-400" />
            <span>{t.sidebar.cableLength}:</span>
          </div>
          <input
            type="range"
            min={1}
            max={Math.min(currentSpec.maxDistanceMeters, 200)}
            value={selectedCableLength}
            onChange={(e) => setSelectedCableLength(parseInt(e.target.value, 10))}
            className="flex-1 accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="font-mono text-emerald-400 font-bold text-xs min-w-[36px] text-right">
            {selectedCableLength} m
          </span>
        </div>
      </div>
    </div>
  );
};

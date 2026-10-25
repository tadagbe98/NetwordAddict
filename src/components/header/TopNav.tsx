import React, { useRef } from 'react';
import {
  Network,
  MousePointer,
  Cable,
  Activity,
  Play,
  Pause,
  StepForward,
  Trash2,
  Download,
  Upload,
  FileCode,
  GraduationCap,
  RotateCcw,
  Languages,
  Layers,
  ListFilter,
} from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import { useI18n } from '../../context/I18nContext';

export const TopNav: React.FC = () => {
  const {
    vendor,
    mode,
    setMode,
    isSimPaused,
    setIsSimPaused,
    stepSimulation,
    clearPackets,
    clearCanvas,
    exportProjectJson,
    importProjectJson,
    exportConfigurationsText,
    setIsLabsOpen,
    setIsVendorModalOpen,
    setIsEventLogOpen,
  } = useNetwork();

  const { language, setLanguage, t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJson = () => {
    const data = exportProjectJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NetSim-Project-${vendor}-${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportConfigs = () => {
    const data = exportConfigurationsText();
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NetSim-Configs-${vendor}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importProjectJson(content);
        if (!ok) alert('Format de fichier de topologie invalide.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const getVendorBadge = () => {
    switch (vendor) {
      case 'huawei':
        return {
          label: 'HUAWEI VRP',
          bg: 'bg-red-950/70 border-red-500/50 text-red-300',
          dot: 'bg-red-500',
        };
      case 'cisco':
        return {
          label: 'CISCO IOS-XE',
          bg: 'bg-sky-950/70 border-sky-500/50 text-sky-300',
          dot: 'bg-sky-400',
        };
      case 'omada':
        return {
          label: 'TP-LINK OMADA',
          bg: 'bg-teal-950/70 border-teal-500/50 text-teal-300',
          dot: 'bg-teal-400',
        };
    }
  };

  const badge = getVendorBadge();

  return (
    <header className="h-14 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Vendor Badge */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-base tracking-tight text-white">NetSim</span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                PRO
              </span>
            </div>
          </div>
        </div>

        {/* Vendor Selector Pill */}
        <button
          onClick={() => setIsVendorModalOpen(true)}
          className={`flex items-center space-x-2 px-2.5 py-1 rounded-full text-xs font-medium border transition-all hover:scale-105 ${badge.bg}`}
          title="Cliquez pour changer d'écosystème constructeur"
        >
          <span className={`w-2 h-2 rounded-full animate-pulse ${badge.dot}`} />
          <span>{badge.label}</span>
          <Layers className="w-3.5 h-3.5 ml-0.5 opacity-70" />
        </button>
      </div>

      {/* Center: Mode Switchers (Select, Cable, Simulate) */}
      <div className="flex items-center bg-slate-950/80 p-1 rounded-lg border border-slate-800 shadow-inner">
        <button
          onClick={() => setMode('select')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            mode === 'select'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span>{t.modes.select}</span>
        </button>

        <button
          onClick={() => setMode('cable')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            mode === 'cable'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Cable className="w-3.5 h-3.5" />
          <span>{t.modes.cable}</span>
        </button>

        <button
          onClick={() => setMode('simulate')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
            mode === 'simulate'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>{t.modes.simulate}</span>
        </button>
      </div>

      {/* Simulation Controls (Play, Step, Purge) */}
      <div className="flex items-center space-x-1 bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800/80">
        <button
          onClick={() => setIsSimPaused(!isSimPaused)}
          className={`p-1.5 rounded hover:bg-slate-800 text-xs transition ${
            isSimPaused ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400 hover:text-amber-300'
          }`}
          title={isSimPaused ? t.simulation.play : t.simulation.pause}
        >
          {isSimPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>

        <button
          onClick={stepSimulation}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
          title={t.simulation.step}
        >
          <StepForward className="w-4 h-4" />
        </button>

        <button
          onClick={clearPackets}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          title={t.simulation.clearPackets}
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        <button
          onClick={() => setIsEventLogOpen(true)}
          className="flex items-center space-x-1 px-2 py-1 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition"
          title={t.simulation.eventLog}
        >
          <ListFilter className="w-3.5 h-3.5 text-blue-400" />
          <span>Logs</span>
        </button>
      </div>

      {/* Right Controls: Labs, Clear, Import/Export, Lang */}
      <div className="flex items-center space-x-2">
        {/* Guided Labs Button */}
        <button
          onClick={() => setIsLabsOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/30 shadow-sm transition-all hover:scale-102"
        >
          <GraduationCap className="w-4 h-4 text-amber-400" />
          <span>{t.labs.guidedLabs}</span>
        </button>

        <div className="h-5 w-px bg-slate-800" />

        {/* Export JSON */}
        <button
          onClick={handleExportJson}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          title={t.exportProject}
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Import JSON */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          title={t.importProject}
        >
          <Upload className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportFile}
          className="hidden"
        />

        {/* Export Configs */}
        <button
          onClick={handleExportConfigs}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          title={t.exportConfig}
        >
          <FileCode className="w-4 h-4" />
        </button>

        {/* Clear Canvas */}
        <button
          onClick={clearCanvas}
          className="p-1.5 rounded hover:bg-red-950/50 hover:text-red-400 text-slate-400 transition"
          title={t.clearCanvas}
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-800" />

        {/* Language switch */}
        <button
          onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
          className="flex items-center space-x-1 px-2 py-1 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          title="Changer de langue / Switch Language"
        >
          <Languages className="w-3.5 h-3.5 text-blue-400" />
          <span>{language.toUpperCase()}</span>
        </button>
      </div>
    </header>
  );
};

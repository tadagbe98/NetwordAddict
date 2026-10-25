import React, { useState } from 'react';
import { Terminal, X, Maximize2, Minimize2, Trash2, HelpCircle } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import { useI18n } from '../../context/I18nContext';
import { XTermWrapper } from './XTermWrapper';
import { CliSession } from '../../types/cli';

export const TerminalModal: React.FC = () => {
  const {
    devices,
    activeTerminalId,
    setActiveTerminalId,
    sessions,
    setSessions,
  } = useNetwork();
  const { t } = useI18n();

  const [isMaximized, setIsMaximized] = useState(false);
  const [showCheatsheet, setShowCheatsheet] = useState(false);

  if (!activeTerminalId) return null;

  const activeDevice = devices.find((d) => d.id === activeTerminalId);
  if (!activeDevice) return null;

  // Initialize session if not exists
  let session = sessions[activeTerminalId];
  if (!session) {
    const initialBanner =
      activeDevice.vendor === 'huawei'
        ? `\n******************************************************************\n* Huawei Versatile Routing Platform Software (VRP)               *\n* Copyright (c) 2000-2026 HUAWEI TECH CO., LTD.                  *\n******************************************************************\n<${activeDevice.hostname}>`
        : activeDevice.vendor === 'cisco'
        ? `\nCisco IOS Software, C2960 Software (C2960-LANBASEK9-M), Version 15.0(2)SE\nTechnical Support: http://www.cisco.com/techsupport\n\nPress RETURN to get started!\n`
        : activeDevice.vendor === 'omada'
        ? `\nTP-Link Omada SDN Managed Hardware CLI Console v5.9\nType "?" for help or use Omada Web Controller.\n`
        : `\nMicrosoft Windows [Version 10.0.19045.3803]\n(c) Microsoft Corporation. All rights reserved.\n`;

    const initialMode: CliSession['mode'] =
      activeDevice.vendor === 'huawei'
        ? 'user_view'
        : activeDevice.vendor === 'cisco'
        ? 'cisco_user_exec'
        : activeDevice.vendor === 'omada'
        ? 'omada_cli'
        : 'pc_cmd';

    session = {
      deviceId: activeTerminalId,
      mode: initialMode,
      history: [],
      historyIndex: 0,
      lines: [{ text: initialBanner, type: 'system' }],
      currentInput: '',
    };
  }

  const updateCurrentSession = (partial: Partial<CliSession>) => {
    setSessions((prev) => ({
      ...prev,
      [activeTerminalId]: { ...session, ...partial },
    }));
  };

  const handleClear = () => {
    updateCurrentSession({ lines: [] });
  };

  // Find all devices with active sessions for tabs
  const openDeviceIds = Object.keys(sessions);
  if (!openDeviceIds.includes(activeTerminalId)) openDeviceIds.push(activeTerminalId);

  return (
    <div
      className={`fixed z-40 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
        isMaximized
          ? 'inset-3'
          : 'bottom-4 right-4 w-[680px] h-[480px]'
      }`}
    >
      {/* Title Bar with Tabs */}
      <div className="h-10 bg-slate-950 border-b border-slate-800 px-3 flex items-center justify-between select-none">
        {/* Device Sessions Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto max-w-[450px]">
          {openDeviceIds.map((devId) => {
            const dev = devices.find((d) => d.id === devId);
            if (!dev) return null;
            const isActive = dev.id === activeTerminalId;
            return (
              <button
                key={dev.id}
                onClick={() => setActiveTerminalId(dev.id)}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition ${
                  isActive
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span className="truncate max-w-[120px]">{dev.hostname}</span>
              </button>
            );
          })}
        </div>

        {/* Window Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setShowCheatsheet(!showCheatsheet)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Aide & Commandes clés"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClear}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title={t.terminal.clear}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Agrandir / Réduire"
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setActiveTerminalId(null)}
            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition"
            title="Fermer le terminal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cheatsheet Quick Help Dropdown */}
      {showCheatsheet && (
        <div className="bg-slate-900 border-b border-slate-800 p-2.5 text-xs text-slate-300 grid grid-cols-2 gap-2 animate-fadeIn">
          <div>
            <div className="font-bold text-white mb-1">
              {activeDevice.vendor === 'huawei' ? 'Huawei VRP' : activeDevice.vendor === 'cisco' ? 'Cisco IOS' : 'Commandes'}
            </div>
            <ul className="space-y-0.5 text-[11px] text-slate-400 font-mono">
              <li>{activeDevice.vendor === 'huawei' ? 'system-view (sys)' : 'enable (en) / conf t'}</li>
              <li>{activeDevice.vendor === 'huawei' ? 'sysname <nom>' : 'hostname <nom>'}</li>
              <li>{activeDevice.vendor === 'huawei' ? 'vlan batch 10 20' : 'vlan 10 / vlan 20'}</li>
              <li>{activeDevice.vendor === 'huawei' ? 'interface GE0/0/1' : 'interface g0/0/0'}</li>
            </ul>
          </div>
          <div>
            <div className="font-bold text-white mb-1">Affichage & Sauvegarde</div>
            <ul className="space-y-0.5 text-[11px] text-slate-400 font-mono">
              <li>{activeDevice.vendor === 'huawei' ? 'display ip int brief' : 'show ip int brief'}</li>
              <li>{activeDevice.vendor === 'huawei' ? 'display vlan' : 'show vlan brief'}</li>
              <li>{activeDevice.vendor === 'huawei' ? 'display current-config' : 'show running-config'}</li>
              <li>{activeDevice.vendor === 'huawei' ? 'save' : 'copy run start (wr)'}</li>
            </ul>
          </div>
        </div>
      )}

      {/* XTerm Terminal Body */}
      <div className="flex-1 overflow-hidden">
        <XTermWrapper
          device={activeDevice}
          session={session}
          onUpdateSession={updateCurrentSession}
        />
      </div>
    </div>
  );
};

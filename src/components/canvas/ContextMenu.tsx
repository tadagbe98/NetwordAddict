import React from 'react';
import {
  Power,
  Terminal,
  Globe,
  Settings,
  Trash2,
  Table,
  Unplug,
  Laptop,
} from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import { useI18n } from '../../context/I18nContext';
import { NetworkDevice, NetworkCable } from '../../types/network';

interface ContextMenuProps {
  x: number;
  y: number;
  device?: NetworkDevice;
  cable?: NetworkCable;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, device, cable, onClose }) => {
  const {
    toggleDevicePower,
    removeDevice,
    removeCable,
    setActiveTerminalId,
    setActiveWebUIId,
    setActivePcId,
    setActiveServerId,
  } = useNetwork();
  const { t } = useI18n();

  return (
    <div
      className="fixed z-50 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-1.5 min-w-[200px] text-xs select-none animate-fadeIn"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {device && (
        <div className="space-y-0.5">
          <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400 border-b border-slate-800 mb-1 flex items-center justify-between">
            <span className="truncate">{device.name}</span>
            <span className="text-[10px] text-slate-500 font-mono">{device.model}</span>
          </div>

          {/* PC / Server Direct App Launch */}
          {device.category === 'end_device' && (
            <button
              onClick={() => {
                setActivePcId(device.id);
                onClose();
              }}
              className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-md hover:bg-blue-600/30 hover:text-white text-slate-200 transition"
            >
              <Laptop className="w-3.5 h-3.5 text-blue-400" />
              <span>Ouvrir Bureau PC Virtuel</span>
            </button>
          )}

          {device.category === 'server' && (
            <button
              onClick={() => {
                setActiveServerId(device.id);
                onClose();
              }}
              className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-md hover:bg-indigo-600/30 hover:text-white text-slate-200 transition"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-400" />
              <span>Configurer Services Serveur</span>
            </button>
          )}

          {/* Open CLI Terminal */}
          {device.category !== 'cloud' && (
            <button
              onClick={() => {
                setActiveTerminalId(device.id);
                onClose();
              }}
              className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-md hover:bg-slate-800 text-slate-200 transition"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.deviceActions.openCli}</span>
            </button>
          )}

          {/* Open WebUI */}
          {(device.category === 'router' || device.category === 'switch' || device.category === 'wlan') && (
            <button
              onClick={() => {
                setActiveWebUIId(device.id);
                onClose();
              }}
              className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-md hover:bg-slate-800 text-slate-200 transition"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.deviceActions.openWebUI}</span>
            </button>
          )}

          {/* Toggle Power */}
          <button
            onClick={() => {
              toggleDevicePower(device.id);
              onClose();
            }}
            className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-md hover:bg-slate-800 text-slate-200 transition"
          >
            <Power
              className={`w-3.5 h-3.5 ${device.isPoweredOn ? 'text-amber-400' : 'text-emerald-400'}`}
            />
            <span>{device.isPoweredOn ? t.deviceActions.powerOff : t.deviceActions.powerOn}</span>
          </button>

          <div className="h-px bg-slate-800 my-1" />

          {/* Delete Device */}
          <button
            onClick={() => {
              removeDevice(device.id);
              onClose();
            }}
            className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-md hover:bg-red-950/60 text-red-400 hover:text-red-300 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.deviceActions.delete}</span>
          </button>
        </div>
      )}

      {cable && (
        <div className="space-y-0.5">
          <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400 border-b border-slate-800 mb-1">
            Liaison Câble ({cable.type.toUpperCase()})
          </div>
          <div className="px-2.5 py-1 text-[11px] text-slate-400 space-y-0.5">
            <div>Longueur : {cable.lengthMeters} m</div>
            <div>Vitesse : {cable.negotiatedSpeed} Mbps</div>
            <div>Milieu : {cable.environment}</div>
            {cable.warning && <div className="text-amber-400 mt-1">{cable.warning}</div>}
          </div>
          <div className="h-px bg-slate-800 my-1" />
          <button
            onClick={() => {
              removeCable(cable.id);
              onClose();
            }}
            className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-md hover:bg-red-950/60 text-red-400 hover:text-red-300 transition"
          >
            <Unplug className="w-3.5 h-3.5" />
            <span>{t.deviceActions.disconnect}</span>
          </button>
        </div>
      )}
    </div>
  );
};

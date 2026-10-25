import React from 'react';
import { NetworkDevice, NetworkPort } from '../../types/network';
import {
  Router as RouterIcon,
  Server,
  Wifi,
  Laptop,
  Cloud,
  Power,
  Terminal,
  Globe,
} from 'lucide-react';

interface DeviceNodeProps {
  device: NetworkDevice;
  isSelected: boolean;
  selectedPortId: string | null;
  onSelect: (device: NetworkDevice) => void;
  onPortClick: (device: NetworkDevice, port: NetworkPort) => void;
  onContextMenu: (e: React.MouseEvent, device: NetworkDevice) => void;
  onMouseDown: (e: React.MouseEvent, device: NetworkDevice) => void;
}

export const DeviceNode: React.FC<DeviceNodeProps> = ({
  device,
  isSelected,
  selectedPortId,
  onSelect,
  onPortClick,
  onContextMenu,
  onMouseDown,
}) => {
  const getDeviceIcon = () => {
    switch (device.category) {
      case 'router':
        return <RouterIcon className="w-5 h-5 text-blue-400" />;
      case 'switch':
        return <Server className="w-5 h-5 text-emerald-400" />;
      case 'wlan':
        return <Wifi className="w-5 h-5 text-teal-400" />;
      case 'end_device':
        return <Laptop className="w-5 h-5 text-amber-400" />;
      case 'server':
        return <Server className="w-5 h-5 text-indigo-400" />;
      case 'cloud':
        return <Cloud className="w-5 h-5 text-purple-400" />;
      default:
        return <RouterIcon className="w-5 h-5 text-slate-400" />;
    }
  };

  const getVendorChassisStyle = () => {
    if (!device.isPoweredOn) {
      return 'border-slate-800 bg-slate-900/60 opacity-60';
    }
    if (isSelected) {
      return 'border-blue-500 bg-slate-900 ring-2 ring-blue-500/50 shadow-xl shadow-blue-500/10';
    }
    switch (device.vendor) {
      case 'huawei':
        return 'border-slate-700/80 bg-slate-900/95 hover:border-red-500/70 hover:shadow-lg hover:shadow-red-500/5';
      case 'cisco':
        return 'border-slate-700/80 bg-slate-900/95 hover:border-sky-500/70 hover:shadow-lg hover:shadow-sky-500/5';
      case 'omada':
        return 'border-slate-700/80 bg-slate-900/95 hover:border-teal-500/70 hover:shadow-lg hover:shadow-teal-500/5';
      default:
        return 'border-slate-700/80 bg-slate-900/95 hover:border-slate-600';
    }
  };

  return (
    <div
      className={`absolute select-none cursor-move transition-shadow rounded-xl border p-2.5 w-[140px] ${getVendorChassisStyle()}`}
      style={{
        left: device.x,
        top: device.y,
        transform: 'translate(0, 0)',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(device);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(e, device);
      }}
      onMouseDown={(e) => onMouseDown(e, device)}
    >
      {/* Top Header: Icon, Hostname, Power indicator */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center space-x-1.5">
          <div className="p-1 rounded-md bg-slate-950 border border-slate-800">
            {getDeviceIcon()}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-white truncate" title={device.hostname}>
              {device.hostname}
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate" title={device.model}>
              {device.model}
            </div>
          </div>
        </div>

        {/* Power Status LED */}
        <div
          className={`w-2 h-2 rounded-full border ${
            device.isPoweredOn
              ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.7)]'
              : 'bg-red-500/50 border-red-500/80'
          }`}
          title={device.isPoweredOn ? 'Alimentation ACTIVE' : 'Équipement ÉTEINT'}
        />
      </div>

      {/* Ports Interface Row with Status LEDs */}
      <div className="bg-slate-950/80 rounded-lg p-1.5 border border-slate-800/80">
        <div className="text-[9px] text-slate-400 font-semibold mb-1 flex items-center justify-between">
          <span>PORTS</span>
          <span className="font-mono text-[9px] text-slate-400">
            {device.ports.filter((p) => p.isUp).length}/{device.ports.length} UP
          </span>
        </div>

        <div className="flex flex-wrap gap-1">
          {device.ports.slice(0, 6).map((port) => {
            const isPortSelected = selectedPortId === port.id;
            return (
              <button
                key={port.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onPortClick(device, port);
                }}
                className={`relative px-1 py-0.5 rounded text-[9px] font-mono border transition flex items-center space-x-1 ${
                  isPortSelected
                    ? 'border-emerald-400 bg-emerald-950/80 text-emerald-200 ring-2 ring-emerald-400/50'
                    : port.isUp
                    ? 'border-emerald-800/60 bg-slate-900 text-slate-200 hover:border-slate-600'
                    : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                }`}
                title={`${port.name} (${port.type}) - ${port.isUp ? 'UP (Connecté)' : 'DOWN (Non relié)'}${port.ipAddress ? ` - ${port.ipAddress}` : ''}`}
              >
                {/* Port LED */}
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    port.isUp
                      ? 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]'
                      : 'bg-slate-600'
                  }`}
                />
                <span className="truncate max-w-[42px]">{port.name.replace(/GigabitEthernet|FastEthernet/, 'GE')}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

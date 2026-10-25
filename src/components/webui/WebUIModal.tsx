import React, { useState } from 'react';
import { X, Maximize2, Minimize2, Globe } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import { HuaweiWebUI } from './huawei/HuaweiWebUI';
import { CiscoWebUI } from './cisco/CiscoWebUI';
import { OmadaControllerUI } from './omada/OmadaControllerUI';

export const WebUIModal: React.FC = () => {
  const { devices, activeWebUIId, setActiveWebUIId } = useNetwork();
  const [isMaximized, setIsMaximized] = useState(false);

  if (!activeWebUIId) return null;

  const device = devices.find((d) => d.id === activeWebUIId);
  if (!device) return null;

  return (
    <div
      className={`fixed z-40 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
        isMaximized
          ? 'inset-3'
          : 'top-16 left-1/2 -translate-x-1/2 w-[900px] h-[600px]'
      }`}
    >
      {/* Title Bar */}
      <div className="h-9 bg-slate-950 border-b border-slate-800 px-3 flex items-center justify-between select-none">
        <div className="flex items-center space-x-2 text-xs text-slate-300 font-semibold">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span>https://{device.ports[0]?.ipAddress || '192.168.1.1'}/admin — {device.name}</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setActiveWebUIId(null)}
            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* WebUI View based on Vendor / Model */}
      <div className="flex-1 overflow-hidden">
        {device.vendor === 'huawei' && <HuaweiWebUI device={device} />}
        {device.vendor === 'cisco' && <CiscoWebUI device={device} />}
        {device.vendor === 'omada' && <OmadaControllerUI device={device} />}
      </div>
    </div>
  );
};

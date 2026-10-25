import React, { useState } from 'react';
import {
  Router as RouterIcon,
  Server,
  Wifi,
  Laptop,
  Cloud,
  Search,
  ChevronDown,
  ChevronRight,
  Plus,
  Info,
} from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import { useI18n } from '../../context/I18nContext';
import { DEVICE_CATALOG } from '../../constants/catalog';
import { DeviceCategory, DeviceModelSpec } from '../../types/network';

export const DevicePalette: React.FC = () => {
  const { vendor, addDevice } = useNetwork();
  const { t } = useI18n();

  const [search, setSearch] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Filter catalog by active vendor OR generic
  const availableDevices = DEVICE_CATALOG.filter((spec) => {
    const isVendorMatch = spec.vendor === vendor || spec.vendor === 'generic';
    if (!isVendorMatch) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        spec.name.toLowerCase().includes(q) ||
        spec.model.toLowerCase().includes(q) ||
        spec.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const categories: { key: DeviceCategory; label: string; icon: React.ReactNode }[] = [
    { key: 'router', label: t.sidebar.categories.routers, icon: <RouterIcon className="w-4 h-4 text-blue-400" /> },
    { key: 'switch', label: t.sidebar.categories.switches, icon: <Server className="w-4 h-4 text-emerald-400" /> },
    { key: 'wlan', label: t.sidebar.categories.wlan, icon: <Wifi className="w-4 h-4 text-teal-400" /> },
    { key: 'end_device', label: t.sidebar.categories.endDevices, icon: <Laptop className="w-4 h-4 text-amber-400" /> },
    { key: 'server', label: 'Serveurs & Services', icon: <Server className="w-4 h-4 text-indigo-400" /> },
    { key: 'cloud', label: t.sidebar.categories.cloud, icon: <Cloud className="w-4 h-4 text-purple-400" /> },
  ];

  const handleAddDevice = (spec: DeviceModelSpec) => {
    // Add around center of canvas with slight random offset
    const randomOffset = () => Math.floor(Math.random() * 80) - 40;
    addDevice(spec.model, 400 + randomOffset(), 250 + randomOffset());
  };

  return (
    <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] select-none">
      {/* Sidebar Header & Search */}
      <div className="p-3 border-b border-slate-800">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          {t.sidebar.devices} ({vendor.toUpperCase()})
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.sidebar.searchPlaceholder}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Catalog List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {categories.map((cat) => {
          const items = availableDevices.filter((d) => d.category === cat.key);
          if (items.length === 0) return null;
          const isCollapsed = collapsedCategories[cat.key];

          return (
            <div key={cat.key} className="bg-slate-950/60 rounded-lg border border-slate-800/80 overflow-hidden">
              <button
                onClick={() => toggleCategory(cat.key)}
                className="w-full flex items-center justify-between p-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/50 transition"
              >
                <div className="flex items-center space-x-2">
                  {cat.icon}
                  <span>{cat.label}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({items.length})</span>
                </div>
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {!isCollapsed && (
                <div className="p-1 space-y-1 bg-slate-950/40">
                  {items.map((spec) => (
                    <div
                      key={spec.model}
                      onClick={() => handleAddDevice(spec)}
                      className="group p-2 rounded-md hover:bg-slate-800/80 cursor-pointer border border-transparent hover:border-slate-700 transition flex items-start justify-between"
                    >
                      <div className="flex-1 pr-2">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-semibold text-white group-hover:text-blue-400 transition">
                            {spec.model}
                          </span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            L{spec.layer}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{spec.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                          Ports: {spec.ports.map((p) => `${p.count}x ${p.name}`).slice(0, 3).join(', ')}
                        </div>
                      </div>

                      <button
                        className="p-1 rounded bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white transition self-center"
                        title="Ajouter au canvas"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-slate-800 bg-slate-950 text-[11px] text-slate-400 flex items-center space-x-2">
        <Info className="w-4 h-4 text-blue-400 shrink-0" />
        <span>Cliquez sur un équipement pour le déposer sur le canvas.</span>
      </div>
    </div>
  );
};

import React from 'react';
import { X, Check, ShieldCheck, Terminal, Globe, Cpu } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import { useI18n } from '../../context/I18nContext';
import { VendorType } from '../../types/network';

export const ProjectVendorModal: React.FC = () => {
  const { vendor, newProject, isVendorModalOpen, setIsVendorModalOpen } = useNetwork();
  const { t } = useI18n();

  if (!isVendorModalOpen) return null;

  const vendors: {
    id: VendorType;
    name: string;
    sub: string;
    description: string;
    features: string[];
    models: string;
    badgeColor: string;
    borderColor: string;
    bgHover: string;
  }[] = [
    {
      id: 'huawei',
      name: 'Huawei Enterprise',
      sub: 'Huawei VRP OS & eSight WebUI',
      description: t.vendorHuaweiDesc,
      features: [
        'Commandes VRP fidèles (system-view, sysname, display...)',
        'VLANs 802.1Q (batch, port default vlan, port link-type)',
        'Interfaces virtuelles Vlanif et routage statique',
        'WebUI AR Router & Switch eSight',
      ],
      models: 'AR651, AR2220, S5735-L, S6720, AC6005',
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
      borderColor: 'border-red-500/40 hover:border-red-500',
      bgHover: 'hover:bg-red-950/20',
    },
    {
      id: 'cisco',
      name: 'Cisco Systems',
      sub: 'Cisco IOS & IOS-XE',
      description: t.vendorCiscoDesc,
      features: [
        'Hiérarchie de modes IOS (enable, conf t, interface, vlan)',
        'Commandes classiques CCNA (switchport, ip route, show run)',
        'Routage inter-VLAN & interfaces SVI',
        'Interface Web moderne Cisco IOS-XE',
      ],
      models: 'ISR 4321, 1941, Catalyst 2960, 3650, WLC 3504',
      badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
      borderColor: 'border-sky-500/40 hover:border-sky-500',
      bgHover: 'hover:bg-sky-950/20',
    },
    {
      id: 'omada',
      name: 'TP-Link Omada SDN',
      sub: 'Omada Software & Hardware Controller',
      description: t.vendorOmadaDesc,
      features: [
        'Contrôleur SDN centralisé Omada v5.9 authentique',
        'Gestion unifiée : Passerelles, Switchs PoE, Bornes Wi-Fi',
        'Adoption en 1-clic, création multi-SSID et VLANs',
        'CLI Omada autonome pour diagnostics',
      ],
      models: 'ER605, ER7206, SG2008P PoE, SG3428, EAP650, OC200',
      badgeColor: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      borderColor: 'border-teal-500/40 hover:border-teal-500',
      bgHover: 'hover:bg-teal-950/20',
    },
  ];

  const handleSelectVendor = (v: VendorType) => {
    if (v !== vendor) {
      const confirmReset = window.confirm(
        'Changer d\'architecture réinitialise le projet actuel pour garantir un écosystème homogène. Continuer ?'
      );
      if (!confirmReset) return;
    }
    newProject(v);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative">
        <button
          onClick={() => setIsVendorModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold tracking-wider uppercase mb-1">
            <Cpu className="w-4 h-4" />
            <span>Architecture Constructeur Mono-Écosystème</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">{t.vendorSelection}</h2>
          <p className="text-sm text-slate-400 mt-1">{t.chooseEcosystem}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vendors.map((item) => {
            const isSelected = item.id === vendor;
            return (
              <div
                key={item.id}
                onClick={() => handleSelectVendor(item.id)}
                className={`relative rounded-xl border p-4 cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? `${item.borderColor} bg-slate-800/80 ring-2 ring-blue-500/40 shadow-lg`
                    : `border-slate-800 bg-slate-950/50 ${item.borderColor} ${item.bgHover}`
                }`}
              >
                {isSelected && (
                  <div className="absolute -top-2.5 right-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow flex items-center space-x-1">
                    <Check className="w-3 h-3" />
                    <span>Actif</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${item.badgeColor}`}>
                      {item.id.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{item.name}</h3>
                  <div className="text-xs text-slate-400 font-medium mb-3">{item.sub}</div>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4">{item.description}</p>

                  <div className="space-y-1.5 mb-4 text-xs text-slate-400">
                    {item.features.map((feat, fidx) => (
                      <div key={fidx} className="flex items-start space-x-1.5">
                        <Check className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-400 mb-1 font-mono">Modèles inclus :</div>
                  <div className="text-xs text-slate-200 font-semibold truncate">{item.models}</div>

                  <button
                    className={`w-full mt-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {isSelected ? 'Sélectionné' : t.startWithVendor}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import { CableType, PortMedium, PortType, CableEnvironment } from '../types/network';

export interface CableSpecification {
  type: CableType;
  name: string;
  maxSpeedMbps: number;
  maxDistanceMeters: number;
  compatibleMediums: PortMedium[];
  compatiblePortTypes: PortType[];
  color: string;
  dashArray?: string;
  description: string;
}

export const CABLE_SPECS: Record<CableType, CableSpecification> = {
  straight: {
    type: 'straight',
    name: 'Ethernet Droit (Straight-Through)',
    maxSpeedMbps: 1000,
    maxDistanceMeters: 100,
    compatibleMediums: ['copper'],
    compatiblePortTypes: ['FE', 'GE'],
    color: '#3b82f6', // blue
    description: 'Relie des équipements différents (PC <-> Switch, Routeur <-> Switch). Câble cuivre RJ45 standard.',
  },
  crossover: {
    type: 'crossover',
    name: 'Ethernet Croisé (Crossover)',
    maxSpeedMbps: 1000,
    maxDistanceMeters: 100,
    compatibleMediums: ['copper'],
    compatiblePortTypes: ['FE', 'GE'],
    color: '#ea580c', // orange
    dashArray: '5,5',
    description: 'Relie des équipements de même niveau (Switch <-> Switch, PC <-> PC, Routeur <-> PC).',
  },
  cat5: {
    type: 'cat5',
    name: 'Cuivre Catégorie 5 (Fast Ethernet)',
    maxSpeedMbps: 100,
    maxDistanceMeters: 100,
    compatibleMediums: ['copper'],
    compatiblePortTypes: ['FE'],
    color: '#94a3b8', // slate
    description: 'Câble ancien limité à 100 Mbps (Fast Ethernet). Ne négocie pas le Gigabit.',
  },
  cat6: {
    type: 'cat6',
    name: 'Cuivre Catégorie 6 / 6e (Gigabit)',
    maxSpeedMbps: 1000,
    maxDistanceMeters: 100,
    compatibleMediums: ['copper'],
    compatiblePortTypes: ['FE', 'GE'],
    color: '#10b981', // emerald
    description: 'Standard Gigabit 1000 Mbps jusqu\'à 100 mètres. Prise en charge PoE standard.',
  },
  cat6a: {
    type: 'cat6a',
    name: 'Cuivre Catégorie 6A (10 Gigabit)',
    maxSpeedMbps: 10000,
    maxDistanceMeters: 100,
    compatibleMediums: ['copper'],
    compatiblePortTypes: ['FE', 'GE', '10GE'],
    color: '#06b6d4', // cyan
    description: 'Liaison haute performance 10 Gbps jusqu\'à 100 mètres, idéale pour PoE++ et points d\'accès Wi-Fi 6.',
  },
  sftp: {
    type: 'sftp',
    name: 'Cuivre S/FTP Blindé (Shielded / Outdoor)',
    maxSpeedMbps: 10000,
    maxDistanceMeters: 100,
    compatibleMediums: ['copper'],
    compatiblePortTypes: ['FE', 'GE', '10GE'],
    color: '#8b5cf6', // purple
    description: 'Câble blindé paire par paire + tresse globale. Recommandé en environnement extérieur ou industriel perturbé.',
  },
  fiber: {
    type: 'fiber',
    name: 'Fibre Optique Multimode/Monomode LC-LC',
    maxSpeedMbps: 10000,
    maxDistanceMeters: 5000,
    compatibleMediums: ['fiber'],
    compatiblePortTypes: ['SFP', 'SFP+', '10GE'],
    color: '#f59e0b', // amber
    description: 'Liaisons optiques haut débit longue portée. Immunité totale aux interférences électromagnétiques.',
  },
  sfp: {
    type: 'sfp',
    name: 'Module Direct SFP/SFP+ (DAC / Twinax)',
    maxSpeedMbps: 10000,
    maxDistanceMeters: 10,
    compatibleMediums: ['fiber', 'copper'],
    compatiblePortTypes: ['SFP', 'SFP+', '10GE'],
    color: '#ec4899', // pink
    description: 'Liaison directe courte portée en baie de brassage (Switch <-> Switch, Serveur).',
  },
  console: {
    type: 'console',
    name: 'Câble Série Console (Rollover RJ45 / USB)',
    maxSpeedMbps: 1,
    maxDistanceMeters: 15,
    compatibleMediums: ['console'],
    compatiblePortTypes: ['Console'],
    color: '#64748b', // slate
    dashArray: '3,3',
    description: 'Câble de configuration hors-bande reliant le port console de l\'équipement au port série/USB du PC.',
  },
  serial: {
    type: 'serial',
    name: 'Câble Série Synchrone WAN V.35 (DCE/DTE)',
    maxSpeedMbps: 8,
    maxDistanceMeters: 50,
    compatibleMediums: ['serial'],
    compatiblePortTypes: ['Serial'],
    color: '#ef4444', // red
    dashArray: '8,4',
    description: 'Liaison spécialisée WAN synchrone point à point entre routeurs distants avec signal d\'horloge.',
  },
};

export function validateCableConnection(
  cableType: CableType,
  srcPortMedium: PortMedium,
  srcPortType: PortType,
  dstPortMedium: PortMedium,
  dstPortType: PortType,
  lengthMeters: number,
  environment: CableEnvironment
): { valid: boolean; reason?: string; warning?: string } {
  const spec = CABLE_SPECS[cableType];
  if (!spec) {
    return { valid: false, reason: 'Type de câble inconnu.' };
  }

  // Medium validation
  if (!spec.compatibleMediums.includes(srcPortMedium)) {
    return {
      valid: false,
      reason: `Le port source ${srcPortType} (${srcPortMedium}) n'est pas compatible avec le câble ${spec.name}.`,
    };
  }

  if (!spec.compatibleMediums.includes(dstPortMedium)) {
    return {
      valid: false,
      reason: `Le port destination ${dstPortType} (${dstPortMedium}) n'est pas compatible avec le câble ${spec.name}.`,
    };
  }

  // Console validation
  if (cableType === 'console') {
    if (srcPortMedium !== 'console' && dstPortMedium !== 'console') {
      return { valid: false, reason: 'Un câble console doit obligatoirement être branché sur un port Console.' };
    }
    return { valid: true };
  }

  // Serial validation
  if (cableType === 'serial') {
    if (srcPortType !== 'Serial' || dstPortType !== 'Serial') {
      return { valid: false, reason: 'Une liaison série WAN nécessite des ports de type Serial sur les deux équipements.' };
    }
  }

  // Copper vs Fiber
  if (srcPortMedium === 'fiber' && cableType !== 'fiber' && cableType !== 'sfp') {
    return { valid: false, reason: 'Impossible de connecter un câble cuivre sur un port optique SFP/Fiber !' };
  }

  if (srcPortMedium === 'copper' && cableType === 'fiber') {
    return { valid: false, reason: 'Impossible de brancher une jarretière fibre optique sur un port RJ45 cuivre !' };
  }

  // Distance check
  if (lengthMeters > spec.maxDistanceMeters) {
    return {
      valid: false,
      reason: `Longueur excessive : ${lengthMeters} m dépasse la portée maximale de ${spec.maxDistanceMeters} m pour ce type de câble. Le lien restera DOWN.`,
    };
  }

  // Environment warning
  let warning: string | undefined;
  if (environment === 'outdoor' && cableType !== 'sftp' && cableType !== 'fiber') {
    warning = 'Attention pédagogique : Câble non blindé posé en extérieur sans gaine résistante aux UV et intempéries. Risque élevé de perturbations et d\'usure prématurée !';
  }

  return { valid: true, warning };
}

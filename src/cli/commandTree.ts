import { CliMode } from '../types/cli';
import { VendorType, NetworkDevice } from '../types/network';

export interface CliCommandItem {
  command: string;
  description: string;
  subcommands?: Record<string, CliCommandItem>;
}

// Huawei VRP Command Dictionary by Mode
export const HUAWEI_COMMANDS: Record<CliMode, Record<string, CliCommandItem>> = {
  user_view: {
    'system-view': { command: 'system-view', description: 'Enter the system view' },
    sys: { command: 'system-view', description: 'Enter the system view (abbreviation)' },
    display: {
      command: 'display',
      description: 'Display system information',
      subcommands: {
        'current-configuration': { command: 'current-configuration', description: 'Display current configuration' },
        cur: { command: 'current-configuration', description: 'Display current configuration (abbrev)' },
        this: { command: 'this', description: 'Display configuration of current view' },
        ip: {
          command: 'ip',
          description: 'Display IP information',
          subcommands: {
            interface: {
              command: 'interface',
              description: 'Display IP interface status',
              subcommands: {
                brief: { command: 'brief', description: 'Display brief summary of interfaces' },
              },
            },
            'routing-table': { command: 'routing-table', description: 'Display IP routing table' },
            pool: { command: 'pool', description: 'Display IP pool information' },
          },
        },
        vlan: { command: 'vlan', description: 'Display VLAN status and member ports' },
        'mac-address': { command: 'mac-address', description: 'Display MAC address table' },
        interface: { command: 'interface', description: 'Display interface information' },
        version: { command: 'version', description: 'Display VRP software version' },
      },
    },
    disp: { command: 'display', description: 'Display system information (abbreviation)' },
    dis: { command: 'display', description: 'Display system information (abbreviation)' },
    ping: { command: 'ping', description: 'Send ICMP echo request packets' },
    save: { command: 'save', description: 'Save current configuration into storage device' },
    reboot: { command: 'reboot', description: 'Reboot the device' },
    quit: { command: 'quit', description: 'Exit current view or disconnect' },
    q: { command: 'quit', description: 'Exit current view (abbreviation)' },
  },

  system_view: {
    sysname: { command: 'sysname', description: 'Specify system host name' },
    interface: {
      command: 'interface',
      description: 'Specify interface configuration view',
      subcommands: {
        GigabitEthernet: { command: 'GigabitEthernet', description: 'GigabitEthernet interface' },
        GE: { command: 'GigabitEthernet', description: 'GigabitEthernet interface (abbrev)' },
        FastEthernet: { command: 'FastEthernet', description: 'FastEthernet interface' },
        Vlanif: { command: 'Vlanif', description: 'VLAN interface (SVI / Gateway)' },
        LoopBack: { command: 'LoopBack', description: 'Loopback interface' },
      },
    },
    int: { command: 'interface', description: 'Specify interface configuration view (abbrev)' },
    vlan: {
      command: 'vlan',
      description: 'Create and enter VLAN view',
      subcommands: {
        batch: { command: 'batch', description: 'Batch create multiple VLANs (e.g. vlan batch 10 20)' },
      },
    },
    'ip route-static': { command: 'ip route-static', description: 'Configure static IP route' },
    ip: {
      command: 'ip',
      description: 'IP protocol parameters',
      subcommands: {
        'route-static': { command: 'route-static', description: 'Configure static IP route' },
        pool: { command: 'pool', description: 'Configure global IP address pool' },
      },
    },
    dhcp: {
      command: 'dhcp',
      description: 'Dynamic Host Configuration Protocol',
      subcommands: {
        enable: { command: 'enable', description: 'Enable global DHCP service' },
      },
    },
    undo: {
      command: 'undo',
      description: 'Cancel configuration or restore default settings',
      subcommands: {
        vlan: { command: 'vlan', description: 'Delete VLAN configuration' },
        'ip route-static': { command: 'ip route-static', description: 'Delete static route' },
        sysname: { command: 'sysname', description: 'Restore default hostname' },
        interface: { command: 'interface', description: 'Delete logical interface' },
      },
    },
    display: {
      command: 'display',
      description: 'Display system information',
      subcommands: {
        'current-configuration': { command: 'current-configuration', description: 'Display current configuration' },
        cur: { command: 'current-configuration', description: 'Display current configuration (abbrev)' },
        this: { command: 'this', description: 'Display configuration of current view' },
        ip: {
          command: 'ip',
          description: 'Display IP information',
          subcommands: {
            interface: {
              command: 'interface',
              description: 'Display IP interface status',
              subcommands: {
                brief: { command: 'brief', description: 'Display brief summary of interfaces' },
              },
            },
            'routing-table': { command: 'routing-table', description: 'Display IP routing table' },
          },
        },
        vlan: { command: 'vlan', description: 'Display VLAN status and member ports' },
        'mac-address': { command: 'mac-address', description: 'Display MAC address table' },
      },
    },
    disp: { command: 'display', description: 'Display system information (abbreviation)' },
    dis: { command: 'display', description: 'Display system information (abbreviation)' },
    save: { command: 'save', description: 'Save current configuration' },
    return: { command: 'return', description: 'Exit to user view (<Huawei>)' },
    quit: { command: 'quit', description: 'Return to lower view' },
    q: { command: 'quit', description: 'Return to lower view (abbrev)' },
  },

  interface_view: {
    port: {
      command: 'port',
      description: 'Configure physical port properties (link-type, default vlan, trunk)',
      subcommands: {
        'link-type': {
          command: 'link-type',
          description: 'Set port link type (access/trunk/hybrid)',
          subcommands: {
            access: { command: 'access', description: 'Access link type (equivalent to Cisco switchport mode access)' },
            trunk: { command: 'trunk', description: 'Trunk link type (equivalent to Cisco switchport mode trunk)' },
            hybrid: { command: 'hybrid', description: 'Hybrid link type' },
          },
        },
        default: {
          command: 'default',
          description: 'Set default port parameters',
          subcommands: {
            vlan: { command: 'vlan', description: 'Set port default VLAN ID (equivalent to Cisco switchport access vlan)' },
          },
        },
        trunk: {
          command: 'trunk',
          description: 'Trunk port attributes',
          subcommands: {
            'allow-pass': {
              command: 'allow-pass',
              description: 'Allow VLANs to pass through',
              subcommands: {
                vlan: { command: 'vlan', description: 'Specify allowed VLAN IDs (e.g. 10 20 or all)' },
              },
            },
          },
        },
      },
    },
    'ip address': { command: 'ip address', description: 'Specify IP address and subnet mask / CIDR' },
    ip: {
      command: 'ip',
      description: 'IP protocol configuration',
      subcommands: {
        address: { command: 'address', description: 'Configure IP address and mask / CIDR' },
        add: { command: 'address', description: 'Configure IP address (abbrev)' },
      },
    },
    description: { command: 'description', description: 'Configure interface description' },
    shutdown: { command: 'shutdown', description: 'Administratively disable the interface' },
    undo: {
      command: 'undo',
      description: 'Cancel configuration on interface (undo shutdown, undo ip address, etc.)',
      subcommands: {
        ip: {
          command: 'ip',
          description: 'Cancel IP configuration',
          subcommands: {
            address: { command: 'address', description: 'Remove IP address from interface' },
            add: { command: 'address', description: 'Remove IP address (abbrev)' },
          },
        },
        'ip address': { command: 'ip address', description: 'Remove IP address from interface' },
        shutdown: { command: 'shutdown', description: 'Enable interface (State UP - equivalent to Cisco no shutdown)' },
        description: { command: 'description', description: 'Remove description' },
        port: {
          command: 'port',
          description: 'Cancel port parameters',
          subcommands: {
            default: { command: 'default', description: 'Reset default VLAN to 1' },
            'link-type': { command: 'link-type', description: 'Reset link-type to default' },
          },
        },
      },
    },
    display: {
      command: 'display',
      description: 'Display information',
      subcommands: {
        this: { command: 'this', description: 'Display current interface configuration' },
        'this include-default': { command: 'this include-default', description: 'Display with defaults' },
      },
    },
    disp: { command: 'display', description: 'Display information (abbrev)' },
    dis: { command: 'display', description: 'Display information (abbrev)' },
    save: { command: 'save', description: 'Save current configuration' },
    return: { command: 'return', description: 'Return to user view' },
    quit: { command: 'quit', description: 'Return to system view' },
    q: { command: 'quit', description: 'Return to system view (abbrev)' },
  },

  vlan_view: {
    description: { command: 'description', description: 'Configure VLAN description' },
    display: {
      command: 'display',
      description: 'Display information',
      subcommands: {
        this: { command: 'this', description: 'Display current VLAN configuration' },
      },
    },
    disp: { command: 'display', description: 'Display information (abbrev)' },
    dis: { command: 'display', description: 'Display information (abbrev)' },
    return: { command: 'return', description: 'Return to user view' },
    quit: { command: 'quit', description: 'Return to system view' },
    q: { command: 'quit', description: 'Return to system view (abbrev)' },
  },

  protocol_view: {
    display: { command: 'display', description: 'Display information' },
    return: { command: 'return', description: 'Return to user view' },
    quit: { command: 'quit', description: 'Return to system view' },
  },

  cisco_user_exec: {},
  cisco_priv_exec: {},
  cisco_global_config: {},
  cisco_interface_config: {},
  cisco_vlan_config: {},
  omada_cli: {},
  pc_cmd: {},
};

/**
 * Convert CIDR (e.g. "24", "22", "16", "8", "30") or dotted subnet to standard dotted subnet mask
 */
export function cidrToSubnetMask(cidrOrMask: string): string {
  if (!cidrOrMask) return '255.255.255.0';
  const trimmed = cidrOrMask.trim();
  if (trimmed.includes('.')) return trimmed;

  const prefix = parseInt(trimmed, 10);
  if (!isNaN(prefix) && prefix >= 0 && prefix <= 32) {
    if (prefix === 0) return '0.0.0.0';
    const maskNum = (~0 << (32 - prefix)) >>> 0;
    return [
      (maskNum >>> 24) & 255,
      (maskNum >>> 16) & 255,
      (maskNum >>> 8) & 255,
      maskNum & 255,
    ].join('.');
  }
  return trimmed;
}

/**
 * Common command completions for quick matching
 */
const COMMON_HUAWEI_INTERFACE_COMMANDS = [
  'port link-type access',
  'port link-type trunk',
  'port link-type hybrid',
  'port default vlan ',
  'port trunk allow-pass vlan ',
  'ip address ',
  'undo shutdown',
  'shutdown',
  'undo ip address',
  'display this',
  'quit',
  'return',
];

const COMMON_HUAWEI_SYSTEM_COMMANDS = [
  'sysname ',
  'vlan batch ',
  'vlan ',
  'interface GigabitEthernet ',
  'interface Vlanif ',
  'ip route-static ',
  'display current-configuration',
  'display ip interface brief',
  'display vlan',
  'display ip routing-table',
  'quit',
  'return',
  'save',
];

/**
 * Get suggestions for Tab completion based on vendor, mode, and line input
 */
export function getCliSuggestions(
  vendor: VendorType | 'generic',
  mode: CliMode,
  currentLine: string
): string[] {
  const trimmed = currentLine.trimStart().toLowerCase();

  if (vendor === 'huawei') {
    // Helpful Cisco cross-suggestions if user types Cisco syntax on Huawei!
    if (trimmed.startsWith('sw') || trimmed.startsWith('switch')) {
      return [
        'port link-type access',
        'port link-type trunk',
        'port default vlan ',
      ];
    }
    if (trimmed.startsWith('no sh')) {
      return ['undo shutdown'];
    }
    if (trimmed.startsWith('no ip')) {
      return ['undo ip address'];
    }
    if (trimmed.startsWith('sh run') || trimmed.startsWith('show run')) {
      return ['display current-configuration', 'display this'];
    }
    if (trimmed.startsWith('conf')) {
      return ['system-view'];
    }

    // Check pre-computed common commands for fast Tab completion
    const pool =
      mode === 'interface_view'
        ? COMMON_HUAWEI_INTERFACE_COMMANDS
        : mode === 'system_view'
        ? COMMON_HUAWEI_SYSTEM_COMMANDS
        : [
            'system-view',
            'display current-configuration',
            'display ip interface brief',
            'display vlan',
            'ping ',
            'save',
            'quit',
          ];

    if (!trimmed) {
      return pool;
    }

    const directMatches = pool.filter((c) => c.toLowerCase().startsWith(trimmed));
    if (directMatches.length > 0) {
      return directMatches;
    }

    // Dynamic tree lookup
    const table = HUAWEI_COMMANDS[mode] || HUAWEI_COMMANDS.user_view;
    const tokens = trimmed.split(/\s+/).filter(Boolean);

    if (tokens.length === 1 && !currentLine.endsWith(' ')) {
      const prefix = tokens[0];
      const matches: string[] = [];
      Object.keys(table).forEach((k) => {
        if (k.toLowerCase().startsWith(prefix)) {
          matches.push(table[k].command);
        }
      });
      return Array.from(new Set(matches));
    }

    const first = tokens[0];
    const root = table[first];
    if (root?.subcommands) {
      if (tokens.length === 1 && currentLine.endsWith(' ')) {
        return Object.values(root.subcommands).map((s) => `${root.command} ${s.command}`);
      }
      const second = tokens[1] || '';
      const subMatches: string[] = [];
      Object.keys(root.subcommands).forEach((subKey) => {
        if (subKey.toLowerCase().startsWith(second)) {
          subMatches.push(`${tokens[0]} ${root.subcommands![subKey].command}`);
        }
      });
      if (subMatches.length > 0) return Array.from(new Set(subMatches));
    }
  }

  if (vendor === 'cisco') {
    const ciscoList = [
      'enable',
      'configure terminal',
      'hostname ',
      'interface GigabitEthernet0/0/0',
      'switchport mode access',
      'switchport mode trunk',
      'switchport access vlan ',
      'show running-config',
      'show ip interface brief',
      'show vlan brief',
      'show ip route',
      'no shutdown',
      'no ip address',
      'copy running-config startup-config',
      'exit',
    ];
    return ciscoList.filter((c) => c.toLowerCase().startsWith(trimmed));
  }

  return [];
}

/**
 * Get help output when user types '?' or '<command> ?' or 'word?'
 */
export function getCliHelpOutput(
  vendor: VendorType | 'generic',
  mode: CliMode,
  currentLine: string
): string {
  const lineWithoutQuestion = currentLine.replace(/\?+$/, '').trim();
  const lower = lineWithoutQuestion.toLowerCase();

  // Cisco help when typed on Huawei
  if (vendor === 'huawei') {
    if (lower.startsWith('switch') || lower.startsWith('sw')) {
      return (
        `  [Aide Pédagogique Constructeur]\n` +
        `  "switchport" est une commande Cisco IOS.\n` +
        `  Sur Huawei VRP, la commande équivalente est :\n` +
        `    port link-type access             (définit le port en mode Access)\n` +
        `    port link-type trunk              (définit le port en mode Trunk)\n` +
        `    port default vlan <id>            (affecte le VLAN au port access)\n` +
        `    port trunk allow-pass vlan <id>   (autorise les VLANs sur le trunk)\n`
      );
    }
    if (lower.startsWith('no')) {
      return (
        `  [Aide Pédagogique Constructeur]\n` +
        `  La commande "no" est propre à Cisco IOS.\n` +
        `  Sur Huawei VRP, l'inversion d'une commande se fait avec "undo" :\n` +
        `    undo shutdown                     (active le port physique UP)\n` +
        `    undo ip address                   (supprime l'adresse IP)\n` +
        `    undo port default vlan            (réinitialise le VLAN par défaut)\n`
      );
    }
    if (lower.startsWith('show') || lower.startsWith('sh')) {
      return (
        `  [Aide Pédagogique Constructeur]\n` +
        `  "show" est une commande Cisco IOS.\n` +
        `  Sur Huawei VRP, utilisez la commande "display" (ou "dis") :\n` +
        `    display current-configuration     (équivalent de show running-config)\n` +
        `    display this                      (affiche la configuration de la vue active)\n` +
        `    display ip interface brief        (équivalent de show ip int br)\n` +
        `    display vlan                      (équivalent de show vlan brief)\n`
      );
    }
  }

  const table = HUAWEI_COMMANDS[mode] || HUAWEI_COMMANDS.user_view;
  const tokens = lineWithoutQuestion.split(/\s+/).filter(Boolean);

  // Case 1: Just "?" alone
  if (tokens.length === 0) {
    let out = '';
    const displayed = new Set<string>();
    Object.values(table).forEach((item) => {
      if (!displayed.has(item.command)) {
        displayed.add(item.command);
        out += `  ${item.command.padEnd(28)} ${item.description}\n`;
      }
    });
    return out.trimEnd();
  }

  // Case 2: "word?" without space before ?
  if (!currentLine.includes(' ') && currentLine.endsWith('?')) {
    const prefix = lineWithoutQuestion.toLowerCase();
    let out = '';
    const matches: string[] = [];
    Object.keys(table).forEach((k) => {
      if (k.toLowerCase().startsWith(prefix)) {
        matches.push(table[k].command);
      }
    });
    const unique = Array.from(new Set(matches));
    if (unique.length === 0) {
      return `  Error: Unrecognized command found at '^' position.`;
    }
    unique.forEach((cmdName) => {
      const item = table[cmdName.toLowerCase()];
      out += `  ${cmdName.padEnd(28)} ${item?.description || ''}\n`;
    });
    return out.trimEnd();
  }

  // Case 3: "<command> ?" with space
  const first = tokens[0].toLowerCase();
  const root = table[first];

  if (!root) {
    return `  Error: Unrecognized command found at '^' position. Type '?' for available commands.`;
  }

  if (tokens.length === 1) {
    if (!root.subcommands || Object.keys(root.subcommands).length === 0) {
      return `  <cr>                         Press Enter to execute`;
    }
    let out = '';
    const displayed = new Set<string>();
    Object.values(root.subcommands).forEach((sub) => {
      if (!displayed.has(sub.command)) {
        displayed.add(sub.command);
        out += `  ${sub.command.padEnd(28)} ${sub.description}\n`;
      }
    });
    out += `  <cr>                         Press Enter to execute\n`;
    return out.trimEnd();
  }

  // Case 4: "<command> <subcommand> ?"
  const second = tokens[1].toLowerCase();
  const subItem = root.subcommands?.[second];

  if (subItem && subItem.subcommands) {
    let out = '';
    Object.values(subItem.subcommands).forEach((s) => {
      out += `  ${s.command.padEnd(28)} ${s.description}\n`;
    });
    return out.trimEnd();
  }

  return `  <cr>                         Press Enter to execute`;
}

export type CliMode =
  // Huawei Modes
  | 'user_view'
  | 'system_view'
  | 'interface_view'
  | 'vlan_view'
  | 'protocol_view'
  // Cisco Modes
  | 'cisco_user_exec'
  | 'cisco_priv_exec'
  | 'cisco_global_config'
  | 'cisco_interface_config'
  | 'cisco_vlan_config'
  // Omada Mode
  | 'omada_cli'
  // Host Windows cmd
  | 'pc_cmd';

export interface CliSession {
  deviceId: string;
  mode: CliMode;
  currentInterface?: string;
  currentVlan?: number;
  history: string[];
  historyIndex: number;
  lines: { text: string; type: 'output' | 'input' | 'error' | 'system' }[];
  currentInput: string;
}

export interface CliCommandContext {
  deviceId: string;
  args: string[];
  rawLine: string;
  session: CliSession;
}

export interface CommandDefinition {
  name: string;
  syntax: string;
  help: string;
  modes: CliMode[];
  subcommands?: CommandDefinition[];
  handler: (context: CliCommandContext) => string | { output: string; newMode?: CliMode; newInterface?: string; newVlan?: number };
}

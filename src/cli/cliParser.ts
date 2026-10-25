import { NetworkDevice } from '../types/network';
import { CliSession } from '../types/cli';

export function getPrompt(device: NetworkDevice, session: CliSession): string {
  const hostname = device.hostname || device.name;

  if (device.vendor === 'huawei') {
    switch (session.mode) {
      case 'user_view':
        return `<${hostname}>`;
      case 'system_view':
        return `[${hostname}]`;
      case 'interface_view':
        return `[${hostname}-${session.currentInterface || 'GigabitEthernet0/0/1'}]`;
      case 'vlan_view':
        return `[${hostname}-vlan${session.currentVlan || 1}]`;
      default:
        return `<${hostname}>`;
    }
  }

  if (device.vendor === 'cisco') {
    switch (session.mode) {
      case 'cisco_user_exec':
        return `${hostname}>`;
      case 'cisco_priv_exec':
        return `${hostname}#`;
      case 'cisco_global_config':
        return `${hostname}(config)#`;
      case 'cisco_interface_config':
        return `${hostname}(config-if)#`;
      case 'cisco_vlan_config':
        return `${hostname}(config-vlan)#`;
      default:
        return `${hostname}>`;
    }
  }

  if (device.vendor === 'omada') {
    return `${hostname}#`;
  }

  // Generic PC
  return `C:\\Users\\User>`;
}

export function tokenize(commandLine: string): string[] {
  return commandLine.trim().split(/\s+/).filter(Boolean);
}

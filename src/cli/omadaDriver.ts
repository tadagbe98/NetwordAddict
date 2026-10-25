import { NetworkDevice } from '../types/network';
import { CliSession } from '../types/cli';
import { tokenize } from './cliParser';

export function executeOmadaCommand(
  device: NetworkDevice,
  session: CliSession,
  rawInput: string
): { output: string } {
  const line = rawInput.trim();
  if (!line) return { output: '' };

  const tokens = tokenize(line);
  const cmd = tokens[0].toLowerCase();

  if (line === '?') {
    return {
      output: `Omada CLI Commands:\n  show system info       Display hardware and SDN adoption status\n  show interfaces        Display port link statuses\n  show vlan              List configured VLANs\n  reboot                 Reboot the device\n  help                   Display help menu`,
    };
  }

  if (cmd === 'show') {
    if (tokens[1]?.toLowerCase() === 'system') {
      return {
        output: `TP-Link Omada Device Information\nModel: ${device.model}\nHostname: ${device.hostname}\nMAC: ${device.ports[0]?.macAddress || '50:C7:BF:12:34:56'}\nController Status: ${device.omadaAdopted ? 'Managed by SDN Controller (Site: Default)' : 'Standalone (Unadopted)'}\nFirmware: 1.2.0 Build 20261015`,
      };
    }
    if (tokens[1]?.toLowerCase() === 'interfaces') {
      let out = `Port    State    Speed/Duplex    VLAN Mode    PVID\n`;
      out += `--------------------------------------------------\n`;
      device.ports.forEach((p) => {
        out += `${p.name.padEnd(8)} ${(p.isUp ? 'UP' : 'DOWN').padEnd(8)} ${p.speed}M/${p.duplex}         ${p.vlanMode.padEnd(12)} ${p.accessVlan}\n`;
      });
      return { output: out };
    }
    if (tokens[1]?.toLowerCase() === 'vlan') {
      let out = `VLAN ID   Name          Ports\n`;
      out += `------------------------------------\n`;
      device.vlans.forEach((v) => {
        out += `${v.id.toString().padEnd(9)} ${v.name.padEnd(13)} ${device.ports.map((p) => p.name).join(', ')}\n`;
      });
      return { output: out };
    }
  }

  if (cmd === 'reboot') {
    return { output: `System is rebooting... Please wait.` };
  }

  return {
    output: `Unknown Omada command. Type "?" for a list of valid commands. Note: Full management is performed through the Omada SDN Controller WebUI.`,
  };
}

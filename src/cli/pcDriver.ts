import { NetworkDevice } from '../types/network';
import { tokenize } from './cliParser';

export function executePcCommand(
  device: NetworkDevice,
  rawInput: string,
  onPingTrigger?: (targetIp: string) => void
): { output: string } {
  const line = rawInput.trim();
  if (!line) return { output: '' };

  const tokens = tokenize(line);
  const cmd = tokens[0].toLowerCase();

  // ipconfig
  if (cmd === 'ipconfig') {
    const isAll = tokens[1]?.toLowerCase() === '/all';
    const cfg = device.endDeviceConfig;
    const port = device.ports[0];

    let out = `\nWindows IP Configuration\n\nEthernet adapter Ethernet0:\n`;
    out += `   Connection-specific DNS Suffix  . : local\n`;
    if (isAll) {
      out += `   Description . . . . . . . . . . . : Fast Ethernet Virtual Controller\n`;
      out += `   Physical Address. . . . . . . . . : ${port?.macAddress || '00-50-56-C0-00-08'}\n`;
      out += `   DHCP Enabled. . . . . . . . . . . : ${cfg?.ipMode === 'dhcp' ? 'Yes' : 'No'}\n`;
    }
    out += `   IPv4 Address. . . . . . . . . . . : ${cfg?.ipAddress || '0.0.0.0'}\n`;
    out += `   Subnet Mask . . . . . . . . . . . : ${cfg?.subnetMask || '0.0.0.0'}\n`;
    out += `   Default Gateway . . . . . . . . . : ${cfg?.gateway || ''}\n`;
    if (isAll) {
      out += `   DNS Servers . . . . . . . . . . . : ${cfg?.dnsServer || '8.8.8.8'}\n`;
    }
    return { output: out };
  }

  // ping <ip>
  if (cmd === 'ping') {
    const target = tokens[1];
    if (!target) {
      return { output: `Usage: ping [-t] [-a] [-n count] [-l size] target_name` };
    }

    if (onPingTrigger) {
      onPingTrigger(target);
    }

    return {
      output: `\nPinging ${target} with 32 bytes of data:\nReply from ${target}: bytes=32 time=2ms TTL=128\nReply from ${target}: bytes=32 time=1ms TTL=128\nReply from ${target}: bytes=32 time=2ms TTL=128\nReply from ${target}: bytes=32 time=1ms TTL=128\n\nPing statistics for ${target}:\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),\nApproximate round trip times in milli-seconds:\n    Minimum = 1ms, Maximum = 2ms, Average = 1ms\n`,
    };
  }

  // arp -a
  if (cmd === 'arp') {
    let out = `\nInterface: ${device.endDeviceConfig?.ipAddress || '192.168.1.10'} --- 0x2\n  Internet Address      Physical Address      Type\n`;
    out += `  ${device.endDeviceConfig?.gateway || '192.168.1.1'}          00-1b-d4-a1-2b-88     dynamic\n`;
    device.arpTable.forEach((entry) => {
      out += `  ${entry.ip.padEnd(20)}  ${entry.mac.padEnd(20)}  dynamic\n`;
    });
    return { output: out };
  }

  // tracert
  if (cmd === 'tracert') {
    const target = tokens[1] || '8.8.8.8';
    return {
      output: `\nTracing route to ${target} over a maximum of 30 hops:\n\n  1    <1 ms    <1 ms    <1 ms  ${device.endDeviceConfig?.gateway || '192.168.1.1'}\n  2     2 ms     1 ms     1 ms  ${target}\n\nTrace complete.\n`,
    };
  }

  // help
  if (cmd === 'help') {
    return {
      output: `Supported commands:\n  ipconfig        Display current IP configuration (/all for details)\n  ping <ip>       Test ICMP network reachability\n  tracert <ip>    Trace packet path to destination\n  arp -a          Display ARP address resolution table\n  cls             Clear screen`,
    };
  }

  return {
    output: `'${tokens[0]}' n'est pas reconnu en tant que commande interne ou externe, un programme exécutable ou un fichier de commandes. Tapez 'help' pour la liste.`,
  };
}

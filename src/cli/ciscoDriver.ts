import { NetworkDevice, NetworkPort, VlanConfig, StaticRoute } from '../types/network';
import { CliSession } from '../types/cli';
import { tokenize } from './cliParser';

export function executeCiscoCommand(
  device: NetworkDevice,
  session: CliSession,
  rawInput: string
): { output: string; newMode?: CliSession['mode']; newInterface?: string; newVlan?: number } {
  const line = rawInput.trim();
  if (!line) return { output: '' };

  const tokens = tokenize(line);
  const cmd = tokens[0].toLowerCase();

  // Contextual help '?'
  if (line === '?') {
    if (session.mode === 'cisco_user_exec') {
      return {
        output: `Exec commands:\n  enable      Turn on privileged commands\n  ping        Send echo messages\n  show        Show running system information\n  exit        Exit from the EXEC`,
      };
    }
    if (session.mode === 'cisco_priv_exec') {
      return {
        output: `Privileged commands:\n  configure   Enter configuration mode\n  copy        Copy from one file to another\n  disable     Turn off privileged commands\n  ping        Send echo messages\n  show        Show running system information\n  write       Write running configuration to memory`,
      };
    }
    if (session.mode === 'cisco_global_config') {
      return {
        output: `Configure commands:\n  hostname    Set system's network name\n  interface   Select an interface to configure\n  vlan        VLAN configuration commands\n  ip route    Establish static routes\n  exit        Exit from configure mode\n  end         Exit to privileged EXEC mode`,
      };
    }
    return {
      output: `Interface commands:\n  ip address  Set for a subinterface an IP address\n  switchport  Set switching mode characteristics\n  shutdown    Shutdown the selected interface\n  no          Negate a command or set its defaults\n  exit        Exit from current interface`,
    };
  }

  // enable / en
  if (cmd === 'enable' || cmd === 'en') {
    if (session.mode === 'cisco_user_exec') {
      return { output: '', newMode: 'cisco_priv_exec' };
    }
    return { output: '' };
  }

  // disable
  if (cmd === 'disable') {
    if (session.mode === 'cisco_priv_exec') {
      return { output: '', newMode: 'cisco_user_exec' };
    }
  }

  // configure terminal / conf t
  if ((cmd === 'configure' || cmd === 'conf') && (tokens[1]?.toLowerCase() === 'terminal' || tokens[1]?.toLowerCase() === 't')) {
    if (session.mode === 'cisco_priv_exec') {
      return {
        output: `Enter configuration commands, one per line. End with CNTL/Z.`,
        newMode: 'cisco_global_config',
      };
    }
    return { output: '% Command not permitted at this privilege level.' };
  }

  // exit / end
  if (cmd === 'exit') {
    if (session.mode === 'cisco_interface_config' || session.mode === 'cisco_vlan_config') {
      return { output: '', newMode: 'cisco_global_config' };
    }
    if (session.mode === 'cisco_global_config') {
      return { output: '', newMode: 'cisco_priv_exec' };
    }
    if (session.mode === 'cisco_priv_exec') {
      return { output: '', newMode: 'cisco_user_exec' };
    }
    return { output: '' };
  }

  if (cmd === 'end') {
    return { output: '', newMode: 'cisco_priv_exec' };
  }

  // hostname <name>
  if (cmd === 'hostname' && tokens[1]) {
    if (session.mode === 'cisco_global_config') {
      device.hostname = tokens[1];
      return { output: '' };
    }
    return { output: '% Incomplete command or incorrect mode.' };
  }

  // vlan <id>
  if (cmd === 'vlan') {
    if (session.mode !== 'cisco_global_config') {
      return { output: '% Command authorization failed.' };
    }
    const vid = parseInt(tokens[1], 10);
    if (!isNaN(vid)) {
      if (!device.vlans.some((v) => v.id === vid)) {
        device.vlans.push({ id: vid, name: `VLAN${vid}`, isUp: true });
      }
      return { output: '', newMode: 'cisco_vlan_config', newVlan: vid };
    }
    return { output: '% Incomplete command.' };
  }

  // vlan mode commands: name <vlan-name>
  if (session.mode === 'cisco_vlan_config') {
    if (cmd === 'name' && tokens[1]) {
      const v = device.vlans.find((item) => item.id === session.currentVlan);
      if (v) v.name = tokens[1];
      return { output: '' };
    }
  }

  // interface <name> (e.g. int g0/0/0 or interface FastEthernet0/1 or int vlan 10)
  if (cmd === 'interface' || cmd === 'int') {
    if (session.mode !== 'cisco_global_config') {
      return { output: '% Interface command requires global configuration mode.' };
    }
    const ifaceName = tokens.slice(1).join('').toLowerCase();
    const port = device.ports.find((p) => {
      const pName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const search = ifaceName.replace(/[^a-z0-9]/g, '');
      return pName === search || pName.includes(search) || search.includes(pName);
    });

    if (port) {
      return { output: '', newMode: 'cisco_interface_config', newInterface: port.name };
    }

    if (ifaceName.includes('vlan')) {
      const vid = parseInt(ifaceName.replace(/[^0-9]/g, ''), 10);
      let vlanObj = device.vlans.find((v) => v.id === vid);
      if (!vlanObj) {
        vlanObj = { id: vid, name: `VLAN${vid}`, isUp: true };
        device.vlans.push(vlanObj);
      }
      return { output: '', newMode: 'cisco_interface_config', newInterface: `Vlan${vid}` };
    }

    return { output: `% Invalid interface type and number.` };
  }

  // Interface configuration mode
  if (session.mode === 'cisco_interface_config') {
    const curIf = session.currentInterface || '';
    const port = device.ports.find((p) => p.name === curIf);
    const isSvi = curIf.startsWith('Vlan');

    // ip address <ip> <mask>
    if (cmd === 'ip' && tokens[1]?.toLowerCase() === 'address') {
      const ip = tokens[2];
      const mask = tokens[3] || '255.255.255.0';
      if (!ip) return { output: '% Incomplete command.' };

      if (port) {
        port.ipAddress = ip;
        port.subnetMask = mask;
        return { output: '' };
      }
      if (isSvi) {
        const vid = parseInt(curIf.replace('Vlan', ''), 10);
        const vlanObj = device.vlans.find((v) => v.id === vid);
        if (vlanObj) {
          vlanObj.ipAddress = ip;
          vlanObj.subnetMask = mask;
          return { output: '' };
        }
      }
    }

    // no shutdown / shutdown
    if (cmd === 'no' && tokens[1]?.toLowerCase() === 'shutdown') {
      if (port) port.isEnabled = true;
      return {
        output: `%LINK-3-UPDOWN: Interface ${curIf}, changed state to up\n%LINEPROTO-5-UPDOWN: Line protocol on Interface ${curIf}, changed state to up`,
      };
    }
    if (cmd === 'shutdown') {
      if (port) port.isEnabled = false;
      return {
        output: `%LINK-5-CHANGED: Interface ${curIf}, changed state to administratively down\n%LINEPROTO-5-UPDOWN: Line protocol on Interface ${curIf}, changed state to down`,
      };
    }

    // switchport mode access | trunk
    if (cmd === 'switchport' && tokens[1]?.toLowerCase() === 'mode') {
      const mode = tokens[2]?.toLowerCase();
      if (port && (mode === 'access' || mode === 'trunk')) {
        port.vlanMode = mode;
        return { output: '' };
      }
      return { output: '% Incomplete command.' };
    }

    // switchport access vlan <id>
    if (cmd === 'switchport' && tokens[1]?.toLowerCase() === 'access' && tokens[2]?.toLowerCase() === 'vlan') {
      const vid = parseInt(tokens[3], 10);
      if (port && !isNaN(vid)) {
        port.accessVlan = vid;
        return { output: '' };
      }
      return { output: '% Invalid VLAN number.' };
    }

    // switchport trunk allowed vlan <id1,id2>
    if (cmd === 'switchport' && tokens[1]?.toLowerCase() === 'trunk' && tokens[2]?.toLowerCase() === 'allowed') {
      if (port) {
        const rawList = tokens[4] || tokens[3];
        const vids = rawList.split(',').map((x) => parseInt(x.trim(), 10)).filter((n) => !isNaN(n));
        port.trunkAllowedVlans = vids;
        return { output: '' };
      }
    }
  }

  // ip route <dest> <mask> <next-hop>
  if (cmd === 'ip' && tokens[1]?.toLowerCase() === 'route') {
    if (session.mode !== 'cisco_global_config') return { output: '% Command only valid in global configuration.' };
    const dest = tokens[2];
    const mask = tokens[3];
    const nextHop = tokens[4];

    if (!dest || !mask || !nextHop) return { output: '% Incomplete command.' };

    device.routes.push({
      id: 'rt-' + Math.random().toString(36).substring(2, 7),
      destination: dest,
      mask,
      nextHop,
      preference: 1, // Cisco default administrative distance for static route
    });
    return { output: '' };
  }

  // show commands (available in priv_exec and user_exec)
  if (cmd === 'show' || cmd === 'sh') {
    const sub = tokens[1]?.toLowerCase();

    // show ip interface brief
    if (sub === 'ip' && tokens[2]?.toLowerCase().startsWith('int')) {
      let out = `Interface              IP-Address      OK? Method Status                Protocol\n`;
      device.ports.forEach((p) => {
        const ipStr = p.ipAddress || 'unassigned';
        const st = p.isUp ? 'up                    ' : 'administratively down ';
        const proto = p.isUp ? 'up' : 'down';
        out += `${p.name.padEnd(22)} ${ipStr.padEnd(15)} YES manual ${st} ${proto}\n`;
      });
      device.vlans.forEach((v) => {
        if (v.ipAddress) {
          out += `Vlan${v.id}`.padEnd(22) + ` ${v.ipAddress.padEnd(15)} YES manual up                    up\n`;
        }
      });
      return { output: out };
    }

    // show vlan brief
    if (sub === 'vlan') {
      let out = `VLAN Name                             Status    Ports\n`;
      out += `---- -------------------------------- --------- -------------------------------\n`;
      device.vlans.forEach((v) => {
        const ports = device.ports
          .filter((p) => (p.vlanMode === 'access' && p.accessVlan === v.id) || (p.vlanMode === 'trunk' && p.trunkAllowedVlans.includes(v.id)))
          .map((p) => p.name)
          .join(', ');
        out += `${v.id.toString().padEnd(4)} ${v.name.padEnd(32)} ${v.isUp ? 'active   ' : 'act/lshut'} ${ports || ''}\n`;
      });
      return { output: out };
    }

    // show running-config
    if (sub === 'running-config' || sub === 'run') {
      let out = `Building configuration...\n\nCurrent configuration : 1248 bytes\n!\nversion 15.1\nservice timestamps log datetime msec\n!\nhostname ${device.hostname}\n!\n`;
      device.vlans.forEach((v) => {
        out += `vlan ${v.id}\n name ${v.name}\n!\n`;
      });
      device.ports.forEach((p) => {
        out += `interface ${p.name}\n`;
        if (p.vlanMode === 'access') {
          out += ` switchport mode access\n switchport access vlan ${p.accessVlan}\n`;
        } else if (p.vlanMode === 'trunk') {
          out += ` switchport mode trunk\n switchport trunk allowed vlan ${p.trunkAllowedVlans.join(',')}\n`;
        }
        if (p.ipAddress) {
          out += ` ip address ${p.ipAddress} ${p.subnetMask || '255.255.255.0'}\n`;
        }
        if (!p.isEnabled) out += ` shutdown\n`;
        out += `!\n`;
      });
      device.routes.forEach((r) => {
        out += `ip route ${r.destination} ${r.mask} ${r.nextHop}\n`;
      });
      out += `end`;
      return { output: out };
    }

    // show ip route
    if (sub === 'ip' && tokens[2]?.toLowerCase() === 'route') {
      let out = `Codes: L - local, C - connected, S - static, R - RIP, O - OSPF\n\nGateway of last resort is not set\n\n`;
      device.ports.forEach((p) => {
        if (p.ipAddress && p.isUp) {
          out += `C     ${p.ipAddress}/24 is directly connected, ${p.name}\n`;
        }
      });
      device.routes.forEach((r) => {
        out += `S     ${r.destination}/24 [1/0] via ${r.nextHop}\n`;
      });
      return { output: out };
    }
  }

  // copy running-config startup-config / write / wr
  if (
    (cmd === 'copy' && tokens[1]?.toLowerCase() === 'running-config') ||
    cmd === 'write' ||
    cmd === 'wr'
  ) {
    device.savedConfigText = device.configText;
    return {
      output: `Destination filename [startup-config]? \nBuilding configuration...\n[OK]`,
    };
  }

  // ping <ip>
  if (cmd === 'ping' && tokens[1]) {
    const target = tokens[1];
    return {
      output: `Type escape sequence to abort.\nSending 5, 100-byte ICMP Echos to ${target}, timeout is 2 seconds:\n!!!!!\nSuccess rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms`,
    };
  }

  return {
    output: `% Invalid input detected at '^' marker.`,
  };
}

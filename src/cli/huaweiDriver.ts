import { NetworkDevice, NetworkPort, VlanConfig, StaticRoute } from '../types/network';
import { CliSession } from '../types/cli';
import { tokenize } from './cliParser';
import { getCliHelpOutput, cidrToSubnetMask } from './commandTree';

export function executeHuaweiCommand(
  device: NetworkDevice,
  session: CliSession,
  rawInput: string
): { output: string; newMode?: CliSession['mode']; newInterface?: string; newVlan?: number } {
  const line = rawInput.trim();
  if (!line) return { output: '' };

  // Help command '?' anywhere in the line
  if (line.endsWith('?')) {
    const helpOutput = getCliHelpOutput('huawei', session.mode, line);
    return { output: helpOutput };
  }

  const tokens = tokenize(line);
  const cmd = tokens[0].toLowerCase();
  const rawLower = line.toLowerCase();

  // =========================================================================
  // CISCO CROSS-COMMAND PEDAGOGICAL TRANSLATOR (Detects and auto-applies Cisco commands)
  // =========================================================================
  if (cmd === 'configure' || cmd === 'conf') {
    return {
      output: `[Aide Pédagogique] "configure terminal" est propre à Cisco IOS.\n` +
              `-> Sur Huawei VRP, la commande équivalente est : "system-view" (ou "sys").\n` +
              `Entrée automatique en vue système [${device.hostname}].`,
      newMode: 'system_view',
    };
  }

  if (cmd === 'enable' || cmd === 'en') {
    return {
      output: `[Aide Pédagogique] "enable" est une commande Cisco IOS.\n` +
              `Sur Huawei VRP, vous êtes déjà en vue utilisateur <${device.hostname}>.\n` +
              `Tapez "system-view" (ou "sys") pour passer en mode configuration.`,
    };
  }

  if (cmd === 'write' || cmd === 'wr' || (cmd === 'copy' && tokens[1]?.toLowerCase() === 'run')) {
    device.savedConfigText = device.configText;
    return {
      output: `[Aide Pédagogique] Sur Huawei VRP, la sauvegarde se fait simplement avec la commande : "save"\n` +
              `Configuration file has been saved successfully.`,
    };
  }

  if (cmd === 'show' || cmd === 'sh') {
    const sub = tokens[1]?.toLowerCase();
    if (sub === 'running-config' || sub === 'run') {
      let out = `[Aide Pédagogique] "show running-config" est une commande Cisco IOS.\n` +
                `-> Sur Huawei VRP, utilisez : "display current-configuration" (ou "dis cur")\n\n`;
      out += `#\nsysname ${device.hostname}\n#\n`;
      device.vlans.forEach((v) => { out += `vlan ${v.id}\n description ${v.name}\n#\n`; });
      device.ports.forEach((p) => {
        out += `interface ${p.name}\n`;
        if (p.vlanMode === 'access') out += ` port link-type access\n port default vlan ${p.accessVlan}\n`;
        else if (p.vlanMode === 'trunk') out += ` port link-type trunk\n port trunk allow-pass vlan ${p.trunkAllowedVlans.join(' ')}\n`;
        if (p.ipAddress) out += ` ip address ${p.ipAddress} ${p.subnetMask || '255.255.255.0'}\n`;
        out += `#\n`;
      });
      out += `return`;
      return { output: out };
    }
    if (sub === 'ip' && tokens[2]?.toLowerCase()?.startsWith('int')) {
      let out = `[Aide Pédagogique] "show ip interface brief" est une commande Cisco IOS.\n` +
                `-> Sur Huawei VRP, utilisez : "display ip interface brief" (ou "dis ip int br")\n\n`;
      out += `Interface                         IP Address/Mask      Physical   Protocol  \n`;
      out += `=======================================================================\n`;
      device.ports.forEach((p) => {
        out += `${p.name.padEnd(34)} ${(p.ipAddress ? p.ipAddress + '/24' : 'unassigned').padEnd(20)} ${(p.isUp ? 'up' : 'down').padEnd(10)} ${(p.isUp ? 'up' : 'down')}\n`;
      });
      return { output: out };
    }
    if (sub === 'vlan') {
      let out = `[Aide Pédagogique] "show vlan" est une commande Cisco IOS.\n` +
                `-> Sur Huawei VRP, utilisez : "display vlan" (ou "dis vlan")\n\n`;
      out += `The total number of VLANs is : ${device.vlans.length}\n`;
      device.vlans.forEach((v) => {
        out += `VID ${v.id} : ${v.name}\n`;
      });
      return { output: out };
    }
  }

  // quit / q
  if (cmd === 'quit' || cmd === 'q') {
    if (session.mode === 'interface_view' || session.mode === 'vlan_view') {
      return { output: '', newMode: 'system_view' };
    }
    if (session.mode === 'system_view') {
      return { output: '', newMode: 'user_view' };
    }
    return { output: 'Info: The current view is already user view.' };
  }

  // return
  if (cmd === 'return') {
    return { output: '', newMode: 'user_view' };
  }

  // system-view / sys
  if (cmd === 'system-view' || cmd === 'sys') {
    if (session.mode === 'user_view') {
      return {
        output: `Enter system view, return user view with return command.`,
        newMode: 'system_view',
      };
    }
    return { output: 'Error: Already in system view or higher.' };
  }

  // sysname <name>
  if ((cmd === 'sysname' || cmd === 'hostname') && tokens[1]) {
    if (session.mode === 'system_view') {
      device.hostname = tokens[1];
      return { output: '' };
    }
    return { output: 'Error: sysname is only supported in system view.' };
  }

  // vlan batch <id1> <id2>... or vlan <id>
  if (cmd === 'vlan') {
    if (session.mode !== 'system_view') {
      return { output: 'Error: VLAN configuration requires system-view.' };
    }
    if (tokens[1]?.toLowerCase() === 'batch') {
      const vlanIds = tokens.slice(2).map((x) => parseInt(x, 10)).filter((n) => !isNaN(n));
      vlanIds.forEach((vid) => {
        if (!device.vlans.some((v) => v.id === vid)) {
          device.vlans.push({ id: vid, name: `VLAN${vid}`, isUp: true });
        }
      });
      return { output: `Info: Succeeded in creating ${vlanIds.length} VLAN(s).` };
    }

    const vid = parseInt(tokens[1], 10);
    if (!isNaN(vid)) {
      if (!device.vlans.some((v) => v.id === vid)) {
        device.vlans.push({ id: vid, name: `VLAN${vid}`, isUp: true });
      }
      return { output: '', newMode: 'vlan_view', newVlan: vid };
    }
    return { output: 'Error: Invalid VLAN ID specified.' };
  }

  // interface <name> (e.g. interface GigabitEthernet0/0/1 or int GE0/0/1 or int Vlanif3)
  if (cmd === 'interface' || cmd === 'int') {
    if (session.mode !== 'system_view') {
      return { output: 'Error: Interface command must be run from system-view.' };
    }
    const ifaceName = tokens.slice(1).join('').toLowerCase();

    // Check Vlanif first (supports "int vlan 3", "int vlanif 3", "interface Vlanif3")
    if (ifaceName.includes('vlanif') || ifaceName.includes('vlan')) {
      const vidStr = ifaceName.replace(/[^0-9]/g, '');
      const vid = parseInt(vidStr, 10);
      if (isNaN(vid)) {
        return { output: 'Error: Wrong parameter found at "^" position (Invalid VLAN ID).' };
      }
      let vlanObj = device.vlans.find((v) => v.id === vid);
      if (!vlanObj) {
        vlanObj = { id: vid, name: `VLAN${vid}`, isUp: true };
        device.vlans.push(vlanObj);
      }
      return { output: '', newMode: 'interface_view', newInterface: `Vlanif${vid}` };
    }

    // Physical ports
    const port = device.ports.find((p) => {
      const pName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const search = ifaceName.replace(/[^a-z0-9]/g, '');
      return pName === search || pName.includes(search) || search.includes(pName);
    });

    if (port) {
      return { output: '', newMode: 'interface_view', newInterface: port.name };
    }

    return { output: `Error: Wrong parameter found at '^' position. Example: "interface GE0/0/1" or "interface Vlanif 10".` };
  }

  // =========================================================================
  // INSIDE INTERFACE VIEW
  // =========================================================================
  if (session.mode === 'interface_view') {
    const curIf = session.currentInterface || '';
    const port = device.ports.find((p) => p.name === curIf);
    const isVlanif = curIf.startsWith('Vlanif');
    const vlanId = isVlanif ? parseInt(curIf.replace('Vlanif', ''), 10) : undefined;
    const vlanObj = vlanId ? device.vlans.find((v) => v.id === vlanId) : undefined;

    // 1. CISCO "switchport" commands entered on Huawei interface:
    if (rawLower.startsWith('switchport') || rawLower.startsWith('switch port') || rawLower.startsWith('switch')) {
      if (rawLower.includes('access vlan')) {
        const vidStr = rawLower.replace(/.*access vlan\s*/, '').trim();
        const vid = parseInt(vidStr, 10);
        if (!isNaN(vid) && port) {
          port.accessVlan = vid;
          return {
            output: `[Aide Pédagogique] "switchport access vlan ${vid}" est une commande Cisco IOS.\n` +
                    `Sur Huawei VRP, la commande équivalente est : "port default vlan ${vid}"\n` +
                    `-> Paramètre appliqué avec succès sur ${curIf} (PVID = ${vid}).`,
          };
        }
      }
      if (rawLower.includes('trunk allowed vlan') || rawLower.includes('trunk allow vlan')) {
        const vidsStr = rawLower.replace(/.*trunk allow.*vlan\s*/, '').trim();
        const vids = vidsStr.split(/[\s,]+/).map((x) => parseInt(x, 10)).filter((n) => !isNaN(n));
        if (port && vids.length > 0) {
          port.trunkAllowedVlans = vids;
          return {
            output: `[Aide Pédagogique] "switchport trunk allowed vlan" est une commande Cisco IOS.\n` +
                    `Sur Huawei VRP, la commande équivalente est : "port trunk allow-pass vlan ${vids.join(' ')}"\n` +
                    `-> Paramètre appliqué avec succès sur ${curIf}.`,
          };
        }
      }
      if (rawLower.includes('mode access') || rawLower.includes('portmode access')) {
        if (port) port.vlanMode = 'access';
        return {
          output: `[Aide Pédagogique] "switchport mode access" est une commande Cisco IOS.\n` +
                  `Sur Huawei VRP, la commande équivalente est : "port link-type access"\n` +
                  `Puis pour assigner le VLAN : "port default vlan <id>"\n` +
                  `-> Paramètre appliqué avec succès sur ${curIf} (mode Access configuré).`,
        };
      }
      if (rawLower.includes('mode trunk') || rawLower.includes('portmode trunk')) {
        if (port) port.vlanMode = 'trunk';
        return {
          output: `[Aide Pédagogique] "switchport mode trunk" est une commande Cisco IOS.\n` +
                  `Sur Huawei VRP, la commande équivalente est : "port link-type trunk"\n` +
                  `Puis pour autoriser les VLANs : "port trunk allow-pass vlan <ids>"\n` +
                  `-> Paramètre appliqué avec succès sur ${curIf} (mode Trunk configuré).`,
        };
      }
      return {
        output: `[Aide Pédagogique] "switchport" est une commande Cisco IOS.\n` +
                `Sur un switch Huawei VRP, utilisez :\n` +
                `  port link-type access|trunk       (définit le type de lien)\n` +
                `  port default vlan <vlan-id>       (affecte le port au VLAN)`,
      };
    }

    // 2. Cisco "no shutdown" on Huawei
    if (rawLower === 'no shutdown' || rawLower === 'no shut') {
      if (port) port.isEnabled = true;
      return {
        output: `[Aide Pédagogique] "no shutdown" est une commande Cisco IOS.\n` +
                `Sur Huawei VRP, utilisez : "undo shutdown"\n` +
                `Info: Interface ${curIf} turned into UP state.`,
      };
    }

    // 3. Cisco "no ip address"
    if (rawLower.startsWith('no ip address') || rawLower.startsWith('no ip add')) {
      if (port) {
        port.ipAddress = undefined;
        port.subnetMask = undefined;
      }
      if (isVlanif && vlanObj) {
        vlanObj.ipAddress = undefined;
        vlanObj.subnetMask = undefined;
      }
      return {
        output: `[Aide Pédagogique] "no ip address" est une commande Cisco IOS.\n` +
                `Sur Huawei VRP, utilisez : "undo ip address"\n` +
                `Info: IP address configuration removed from ${curIf}.`,
      };
    }

    // 4. display this (disp this, dis this)
    if (cmd === 'display' || cmd === 'disp' || cmd === 'dis') {
      if (tokens[1]?.toLowerCase() === 'this') {
        let out = `#\ninterface ${curIf}\n`;
        if (port) {
          if (port.vlanMode === 'access') {
            out += ` port link-type access\n`;
            if (port.accessVlan !== 1) {
              out += ` port default vlan ${port.accessVlan}\n`;
            }
          } else if (port.vlanMode === 'trunk') {
            out += ` port link-type trunk\n`;
            if (port.trunkAllowedVlans.length > 0) {
              out += ` port trunk allow-pass vlan ${port.trunkAllowedVlans.join(' ')}\n`;
            }
          }
          if (port.ipAddress) {
            out += ` ip address ${port.ipAddress} ${port.subnetMask || '255.255.255.0'}\n`;
          }
          if (!port.isEnabled) {
            out += ` shutdown\n`;
          }
        }
        if (isVlanif && vlanObj) {
          if (vlanObj.ipAddress) {
            out += ` ip address ${vlanObj.ipAddress} ${vlanObj.subnetMask || '255.255.255.0'}\n`;
          }
        }
        out += `#\nreturn`;
        return { output: out };
      }
    }

    // 5. Native Huawei: port link-type access | trunk | hybrid
    if (cmd === 'port' && tokens[1]?.toLowerCase() === 'link-type') {
      const type = tokens[2]?.toLowerCase();
      if (port && (type === 'access' || type === 'trunk' || type === 'hybrid')) {
        port.vlanMode = type;
        return { output: '' };
      }
      return { output: 'Error: Invalid link-type parameter (choose access, trunk, or hybrid).' };
    }

    // 6. Native Huawei: port default vlan <id>
    if (cmd === 'port' && tokens[1]?.toLowerCase() === 'default' && tokens[2]?.toLowerCase() === 'vlan') {
      const vid = parseInt(tokens[3], 10);
      if (port && !isNaN(vid)) {
        port.accessVlan = vid;
        return { output: '' };
      }
      return { output: 'Error: Invalid VLAN ID specified.' };
    }

    // 7. Native Huawei: port trunk allow-pass vlan <id> [id2...]
    if (cmd === 'port' && tokens[1]?.toLowerCase() === 'trunk' && tokens[2]?.toLowerCase().startsWith('allow')) {
      if (port) {
        if (tokens[4]?.toLowerCase() === 'all') {
          port.trunkAllowedVlans = Array.from({ length: 4094 }, (_, i) => i + 1);
        } else {
          const vids = tokens.slice(4).map((x) => parseInt(x, 10)).filter((n) => !isNaN(n));
          vids.forEach((v) => {
            if (!port.trunkAllowedVlans.includes(v)) port.trunkAllowedVlans.push(v);
          });
        }
        return { output: '' };
      }
    }

    // 8. Native Huawei: ip address <ip> <mask/cidr> (e.g. ip address 10.3.0.1 22)
    if (cmd === 'ip' && (tokens[1]?.toLowerCase() === 'address' || tokens[1]?.toLowerCase() === 'add')) {
      const ip = tokens[2];
      const rawMask = tokens[3] || '24';
      const mask = cidrToSubnetMask(rawMask);

      if (!ip) return { output: 'Error: Incomplete command (missing IP address and mask).' };

      if (port) {
        port.ipAddress = ip;
        port.subnetMask = mask;
        return { output: '' };
      }
      if (isVlanif && vlanObj) {
        vlanObj.ipAddress = ip;
        vlanObj.subnetMask = mask;
        return { output: '' };
      }
    }

    // 9. Native Huawei: UNDO Commands in interface view
    if (cmd === 'undo') {
      const sub = tokens[1]?.toLowerCase();

      if (sub === 'ip' || sub === 'ip address' || (sub === 'ip' && (tokens[2]?.toLowerCase() === 'address' || tokens[2]?.toLowerCase() === 'add'))) {
        if (port) {
          port.ipAddress = undefined;
          port.subnetMask = undefined;
          return { output: `Info: IP address configuration removed from ${curIf}.` };
        }
        if (isVlanif && vlanObj) {
          vlanObj.ipAddress = undefined;
          vlanObj.subnetMask = undefined;
          return { output: `Info: IP address configuration removed from ${curIf}.` };
        }
      }

      // If user typed: "undo 10.3.0.1 24" or "undo 10.3.0.1"
      if (tokens[1] && tokens[1].match(/^\d+\.\d+\.\d+\.\d+$/)) {
        if (port) {
          port.ipAddress = undefined;
          port.subnetMask = undefined;
          return { output: `Info: IP address ${tokens[1]} removed from ${curIf}.` };
        }
        if (isVlanif && vlanObj) {
          vlanObj.ipAddress = undefined;
          vlanObj.subnetMask = undefined;
          return { output: `Info: IP address ${tokens[1]} removed from ${curIf}.` };
        }
      }

      // undo shutdown
      if (sub === 'shutdown') {
        if (port) port.isEnabled = true;
        return { output: `Info: Interface ${curIf} turned into UP state.` };
      }

      // undo port default vlan
      if (sub === 'port' && tokens[2]?.toLowerCase() === 'default' && tokens[3]?.toLowerCase() === 'vlan') {
        if (port) {
          port.accessVlan = 1;
          return { output: '' };
        }
      }

      // undo port link-type
      if (sub === 'port' && tokens[2]?.toLowerCase() === 'link-type') {
        if (port) {
          port.vlanMode = 'access';
          port.accessVlan = 1;
          return { output: '' };
        }
      }

      return {
        output: `Error: Wrong parameter found at '^' position. Supported: "undo ip address", "undo shutdown", "undo port default vlan".`,
      };
    }

    // 10. shutdown
    if (cmd === 'shutdown') {
      if (port) port.isEnabled = false;
      return { output: `Info: Interface ${curIf} turned into DOWN state.` };
    }

    // 11. description <text>
    if (cmd === 'description') {
      return { output: '' };
    }
  }

  // =========================================================================
  // INSIDE VLAN VIEW
  // =========================================================================
  if (session.mode === 'vlan_view') {
    if ((cmd === 'display' || cmd === 'disp' || cmd === 'dis') && tokens[1]?.toLowerCase() === 'this') {
      const v = device.vlans.find((item) => item.id === session.currentVlan);
      let out = `#\nvlan ${session.currentVlan}\n`;
      if (v?.name) out += ` description ${v.name}\n`;
      out += `#\nreturn`;
      return { output: out };
    }

    if (cmd === 'description' && tokens[1]) {
      const v = device.vlans.find((item) => item.id === session.currentVlan);
      if (v) v.name = tokens.slice(1).join(' ');
      return { output: '' };
    }
  }

  // ip route-static <dest> <mask/cidr> <nexthop>
  if (cmd === 'ip' && tokens[1]?.toLowerCase() === 'route-static') {
    if (session.mode !== 'system_view') return { output: 'Error: ip route-static must be run in system-view.' };
    const dest = tokens[2];
    const rawMask = tokens[3];
    const nextHop = tokens[4];

    if (!dest || !rawMask || !nextHop) {
      return { output: 'Error: Incomplete command. Syntax: ip route-static <destination> <mask|cidr> <next-hop>' };
    }

    const mask = cidrToSubnetMask(rawMask);

    device.routes.push({
      id: 'rt-' + Math.random().toString(36).substring(2, 7),
      destination: dest,
      mask,
      nextHop,
      preference: 60,
    });
    return { output: '' };
  }

  // Global UNDO commands (in system_view)
  if (cmd === 'undo') {
    const sub = tokens[1]?.toLowerCase();

    // undo vlan <id>
    if (sub === 'vlan') {
      const vid = parseInt(tokens[2], 10);
      if (!isNaN(vid) && vid !== 1) {
        device.vlans = device.vlans.filter((v) => v.id !== vid);
        return { output: `Info: VLAN ${vid} deleted.` };
      }
      return { output: 'Error: Cannot delete default VLAN 1 or invalid VLAN ID.' };
    }

    // undo ip route-static <dest>
    if (sub === 'ip' && tokens[2]?.toLowerCase() === 'route-static') {
      const dest = tokens[3];
      if (dest) {
        device.routes = device.routes.filter((r) => r.destination !== dest);
        return { output: `Info: Static route to ${dest} deleted.` };
      }
    }

    // undo sysname
    if (sub === 'sysname') {
      device.hostname = 'Huawei';
      return { output: '' };
    }
  }

  // =========================================================================
  // DISPLAY COMMANDS
  // =========================================================================
  if (cmd === 'display' || cmd === 'disp' || cmd === 'dis') {
    const sub = tokens[1]?.toLowerCase();

    // display this (in system view or user view)
    if (sub === 'this') {
      let out = `#\nsysname ${device.hostname}\n#\n`;
      device.vlans.forEach((v) => {
        out += `vlan ${v.id}\n description ${v.name}\n#\n`;
      });
      out += `return`;
      return { output: out };
    }

    // display ip interface brief
    if (sub === 'ip' && tokens[2]?.toLowerCase().startsWith('int')) {
      let out = `Interface                         IP Address/Mask      Physical   Protocol  \n`;
      out += `=======================================================================\n`;
      device.ports.forEach((p) => {
        const ipStr = p.ipAddress ? `${p.ipAddress}/24` : 'unassigned';
        const phy = p.isUp ? 'up' : 'down';
        const proto = p.isUp ? 'up' : 'down';
        out += `${p.name.padEnd(34)} ${ipStr.padEnd(20)} ${phy.padEnd(10)} ${proto}\n`;
      });
      device.vlans.forEach((v) => {
        if (v.ipAddress) {
          out += `Vlanif${v.id}`.padEnd(34) + ` ${v.ipAddress}/24`.padEnd(20) + ` up`.padEnd(10) + ` up\n`;
        }
      });
      return { output: out };
    }

    // display vlan
    if (sub === 'vlan') {
      let out = `The total number of VLANs is : ${device.vlans.length}\n`;
      out += `------------------------------------------------------------------------\n`;
      out += `U: Up;         D: Down;         TG: Tagged;        UT: Untagged\n`;
      out += `VID  Type    Status  Property      MAC-LRN  Ports\n`;
      out += `------------------------------------------------------------------------\n`;
      device.vlans.forEach((v) => {
        const ports = device.ports
          .filter((p) => (p.vlanMode === 'access' && p.accessVlan === v.id) || (p.vlanMode === 'trunk' && p.trunkAllowedVlans.includes(v.id)))
          .map((p) => p.name)
          .join(', ');
        out += `${v.id.toString().padEnd(4)} common  ${v.isUp ? 'up' : 'down'}    default       enable   ${ports || 'none'}\n`;
      });
      return { output: out };
    }

    // display ip routing-table
    if (sub === 'ip' && (tokens[2]?.toLowerCase() === 'routing-table' || tokens[2]?.toLowerCase() === 'route')) {
      let out = `Route Flags: R - relay, D - download to fib\n`;
      out += `------------------------------------------------------------------------------\n`;
      out += `Routing Tables: Public\n`;
      out += `         Destinations : ${device.routes.length + 1}        Routes : ${device.routes.length + 1}\n\n`;
      out += `Destination/Mask    Proto   Pre  Cost      Flags NextHop         Interface\n\n`;
      device.ports.forEach((p) => {
        if (p.ipAddress && p.isUp) {
          out += `${p.ipAddress}/24`.padEnd(20) + `Direct  0    0           D   127.0.0.1       ${p.name}\n`;
        }
      });
      device.vlans.forEach((v) => {
        if (v.ipAddress) {
          out += `${v.ipAddress}/24`.padEnd(20) + `Direct  0    0           D   127.0.0.1       Vlanif${v.id}\n`;
        }
      });
      device.routes.forEach((r) => {
        out += `${r.destination}/24`.padEnd(20) + `Static  ${r.preference || 60}   0           D   ${r.nextHop.padEnd(15)} GE0/0/0\n`;
      });
      return { output: out };
    }

    // display current-configuration
    if (sub === 'current-configuration' || sub === 'cur') {
      let out = `#\nsysname ${device.hostname}\n#\n`;
      device.vlans.forEach((v) => {
        out += `vlan ${v.id}\n description ${v.name}\n#\n`;
      });
      device.ports.forEach((p) => {
        out += `interface ${p.name}\n`;
        if (p.vlanMode === 'access') {
          out += ` port link-type access\n port default vlan ${p.accessVlan}\n`;
        } else if (p.vlanMode === 'trunk') {
          out += ` port link-type trunk\n port trunk allow-pass vlan ${p.trunkAllowedVlans.join(' ')}\n`;
        }
        if (p.ipAddress) {
          out += ` ip address ${p.ipAddress} ${p.subnetMask || '255.255.255.0'}\n`;
        }
        if (!p.isEnabled) out += ` shutdown\n`;
        out += `#\n`;
      });
      device.vlans.forEach((v) => {
        if (v.ipAddress) {
          out += `interface Vlanif${v.id}\n ip address ${v.ipAddress} ${v.subnetMask || '255.255.255.0'}\n#\n`;
        }
      });
      device.routes.forEach((r) => {
        out += `ip route-static ${r.destination} ${r.mask} ${r.nextHop}\n`;
      });
      out += `return`;
      return { output: out };
    }
  }

  // save
  if (cmd === 'save') {
    device.savedConfigText = device.configText;
    return {
      output: `The current configuration will be written to the device.\nAre you sure to continue? (y/n)[n]: y\nIt will take several minutes to save configuration file, please wait........\nConfiguration file has been saved successfully.`,
    };
  }

  // ping <ip>
  if (cmd === 'ping' && tokens[1]) {
    const target = tokens[1];
    return {
      output: `  PING ${target} : 56  data bytes, press CTRL_C to break\n    Reply from ${target} : bytes=56 Sequence=1 ttl=255 time=2 ms\n    Reply from ${target} : bytes=56 Sequence=2 ttl=255 time=1 ms\n    Reply from ${target} : bytes=56 Sequence=3 ttl=255 time=2 ms\n    Reply from ${target} : bytes=56 Sequence=4 ttl=255 time=1 ms\n    Reply from ${target} : bytes=56 Sequence=5 ttl=255 time=1 ms\n\n  --- ${target} ping statistics ---\n    5 packet(s) transmitted\n    5 packet(s) received\n    0.00% packet loss\n    round-trip min/avg/max = 1/1/2 ms`,
    };
  }

  return {
    output: `Error: Unrecognized command found at '^' position. Type '?' for available commands.`,
  };
}

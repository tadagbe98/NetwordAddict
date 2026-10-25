import { NetworkDevice, NetworkPort, NetworkPacket, PacketStep } from '../types/network';

// IP Math Helpers
export function ipToNumber(ip: string): number {
  return ip
    .split('.')
    .reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

export function numberToIp(num: number): string {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255,
  ].join('.');
}

export function isIpInSubnet(ip: string, network: string, mask: string): boolean {
  try {
    const ipNum = ipToNumber(ip);
    const netNum = ipToNumber(network);
    const maskNum = ipToNumber(mask);
    return (ipNum & maskNum) === (netNum & maskNum);
  } catch {
    return false;
  }
}

export function getNetworkAddress(ip: string, mask: string): string {
  const ipNum = ipToNumber(ip);
  const maskNum = ipToNumber(mask);
  return numberToIp(ipNum & maskNum);
}

export interface L3RoutingResult {
  action: 'DELIVER_LOCAL' | 'ROUTE_FORWARD' | 'DROP';
  egressPort?: NetworkPort;
  nextHopIp?: string;
  nextHopMac?: string;
  dropReason?: string;
  step: PacketStep;
}

export function processL3Routing(
  device: NetworkDevice,
  ingressPort: NetworkPort,
  packet: NetworkPacket
): L3RoutingResult {
  // 1. Check if packet is intended for this device directly
  const deviceOwnIps: string[] = [];
  device.ports.forEach((p) => {
    if (p.ipAddress) deviceOwnIps.push(p.ipAddress);
  });
  device.vlans.forEach((v) => {
    if (v.ipAddress) deviceOwnIps.push(v.ipAddress);
  });
  if (device.endDeviceConfig?.ipAddress) {
    deviceOwnIps.push(device.endDeviceConfig.ipAddress);
  }

  if (deviceOwnIps.includes(packet.dstIp)) {
    return {
      action: 'DELIVER_LOCAL',
      step: {
        stepIndex: packet.steps.length + 1,
        deviceId: device.id,
        deviceName: device.name,
        portName: ingressPort.name,
        action: 'RECEIVED',
        layer: 'L3',
        detail: `Paquet délivré localement à ${device.hostname} (${packet.dstIp}).`,
      },
    };
  }

  // 2. If device is L2 only (e.g. standard L2 switch without routing)
  if (device.category === 'switch' && (device.model === 'S5735-L' || device.model === 'Catalyst-2960' || device.model === 'SG2008P')) {
    // Check if SVI configured
    const hasSvi = device.vlans.some((v) => v.ipAddress);
    if (!hasSvi) {
      return {
        action: 'DROP',
        dropReason: `Le commutateur ${device.hostname} est de niveau L2 et n'a pas de routage activé.`,
        step: {
          stepIndex: packet.steps.length + 1,
          deviceId: device.id,
          deviceName: device.name,
          portName: ingressPort.name,
          action: 'DROPPED',
          layer: 'L3',
          detail: 'Équipement L2 incapable de router vers un réseau différent.',
        },
      };
    }
  }

  // 3. Check directly connected subnets on router ports or SVIs
  for (const port of device.ports) {
    if (port.ipAddress && port.subnetMask && port.isUp) {
      if (isIpInSubnet(packet.dstIp, port.ipAddress, port.subnetMask)) {
        // Direct delivery on this port's subnet!
        return {
          action: 'ROUTE_FORWARD',
          egressPort: port,
          nextHopIp: packet.dstIp,
          step: {
            stepIndex: packet.steps.length + 1,
            deviceId: device.id,
            deviceName: device.name,
            portName: port.name,
            action: 'ROUTED',
            layer: 'L3',
            detail: `Routage direct (réseau connecté) via ${port.name}.`,
          },
        };
      }
    }
  }

  // 4. Lookup Static Routes
  for (const route of device.routes) {
    if (isIpInSubnet(packet.dstIp, route.destination, route.mask)) {
      // Find which port reaches this nextHop
      let egress: NetworkPort | undefined;

      if (route.interfaceName) {
        egress = device.ports.find((p) => p.name.toLowerCase() === route.interfaceName?.toLowerCase() && p.isUp);
      } else {
        egress = device.ports.find(
          (p) => p.ipAddress && p.subnetMask && isIpInSubnet(route.nextHop, p.ipAddress, p.subnetMask) && p.isUp
        );
      }

      if (egress) {
        return {
          action: 'ROUTE_FORWARD',
          egressPort: egress,
          nextHopIp: route.nextHop,
          step: {
            stepIndex: packet.steps.length + 1,
            deviceId: device.id,
            deviceName: device.name,
            portName: egress.name,
            action: 'ROUTED',
            layer: 'L3',
            detail: `Route statique ${route.destination}/${route.mask} empruntée via next-hop ${route.nextHop} (${egress.name}).`,
          },
        };
      }
    }
  }

  // 5. No route found
  return {
    action: 'DROP',
    dropReason: `Aucune route trouvée pour la destination ${packet.dstIp} sur ${device.hostname} (Réseau inaccessible / Destination Unreachable).`,
    step: {
      stepIndex: packet.steps.length + 1,
      deviceId: device.id,
      deviceName: device.name,
      portName: ingressPort.name,
      action: 'DROPPED',
      layer: 'L3',
      detail: `Destination réseau ${packet.dstIp} introuvable dans la table de routage.`,
    },
  };
}

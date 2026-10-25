import { NetworkDevice, NetworkPort, MacTableEntry, NetworkPacket, PacketStep } from '../types/network';

export interface L2ForwardingResult {
  egressPorts: NetworkPort[];
  macLearned: boolean;
  dropReason?: string;
  step: PacketStep;
}

export function processL2Switching(
  device: NetworkDevice,
  ingressPort: NetworkPort,
  packet: NetworkPacket
): L2ForwardingResult {
  // Determine effective VLAN
  let effectiveVlan = packet.vlanId || 1;

  if (ingressPort.vlanMode === 'access') {
    effectiveVlan = ingressPort.accessVlan || 1;
  } else if (ingressPort.vlanMode === 'trunk') {
    if (packet.vlanId && !ingressPort.trunkAllowedVlans.includes(packet.vlanId)) {
      return {
        egressPorts: [],
        macLearned: false,
        dropReason: `Trame VLAN ${packet.vlanId} rejetée par le port trunk ${ingressPort.name} (VLAN non autorisé).`,
        step: {
          stepIndex: packet.steps.length + 1,
          deviceId: device.id,
          deviceName: device.name,
          portName: ingressPort.name,
          action: 'DROPPED',
          layer: 'L2',
          detail: `Trame VLAN ${packet.vlanId} bloquée par la politique trunk.`,
        },
      };
    }
  }

  // MAC Learning
  let macLearned = false;
  if (packet.srcMac && packet.srcMac !== 'FF:FF:FF:FF:FF:FF') {
    const existingIndex = device.macTable.findIndex(
      (entry) => entry.mac.toLowerCase() === packet.srcMac.toLowerCase() && entry.vlanId === effectiveVlan
    );

    if (existingIndex >= 0) {
      device.macTable[existingIndex].portId = ingressPort.id;
      device.macTable[existingIndex].portName = ingressPort.name;
      device.macTable[existingIndex].age = 0;
    } else {
      device.macTable.push({
        mac: packet.srcMac.toUpperCase(),
        vlanId: effectiveVlan,
        portId: ingressPort.id,
        portName: ingressPort.name,
        type: 'DYNAMIC',
        age: 0,
      });
      macLearned = true;
    }
  }

  // Check if destination is Broadcast
  const isBroadcast = packet.dstMac.toUpperCase() === 'FF:FF:FF:FF:FF:FF';

  // Candidate ports: all UP ports except the ingress port
  const candidatePorts = device.ports.filter(
    (p) => p.isUp && p.id !== ingressPort.id && p.isEnabled && p.medium !== 'console'
  );

  // Filter ports matching the VLAN
  const vlanMatchingPorts = candidatePorts.filter((p) => {
    if (p.vlanMode === 'access') {
      return p.accessVlan === effectiveVlan;
    }
    if (p.vlanMode === 'trunk') {
      return p.trunkAllowedVlans.includes(effectiveVlan);
    }
    return false;
  });

  if (isBroadcast) {
    return {
      egressPorts: vlanMatchingPorts,
      macLearned,
      step: {
        stepIndex: packet.steps.length + 1,
        deviceId: device.id,
        deviceName: device.name,
        portName: ingressPort.name,
        action: 'SWITCHED',
        layer: 'L2',
        detail: `Diffusion Broadcast (VLAN ${effectiveVlan}) vers ${vlanMatchingPorts.length} port(s).`,
      },
    };
  }

  // Lookup in MAC Table
  const targetEntry = device.macTable.find(
    (entry) => entry.mac.toUpperCase() === packet.dstMac.toUpperCase() && entry.vlanId === effectiveVlan
  );

  if (targetEntry) {
    const egress = vlanMatchingPorts.find((p) => p.id === targetEntry.portId);
    if (egress) {
      return {
        egressPorts: [egress],
        macLearned,
        step: {
          stepIndex: packet.steps.length + 1,
          deviceId: device.id,
          deviceName: device.name,
          portName: egress.name,
          action: 'FORWARDED',
          layer: 'L2',
          detail: `Commutation directe (Unicast) vers ${egress.name} d'après la table MAC.`,
        },
      };
    }
  }

  // Unknown Unicast: Flooding
  return {
    egressPorts: vlanMatchingPorts,
    macLearned,
    step: {
      stepIndex: packet.steps.length + 1,
      deviceId: device.id,
      deviceName: device.name,
      portName: ingressPort.name,
      action: 'SWITCHED',
      layer: 'L2',
      detail: `MAC de destination inconnue dans le VLAN ${effectiveVlan} : Inondation (Unknown Unicast Flooding).`,
    },
  };
}

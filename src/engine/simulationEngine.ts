import {
  NetworkDevice,
  NetworkCable,
  NetworkPort,
  NetworkPacket,
  PacketStep,
  PacketType,
} from '../types/network';
import { processL2Switching } from './layer2Switching';
import { processL3Routing } from './layer3Routing';
import { handleDhcpDiscover, handleDnsQuery, handleHttpRequest } from './services';

export interface SimulationEvent {
  id: string;
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'PACKET';
  sourceName: string;
  targetName?: string;
  message: string;
  packetId?: string;
}

export class SimulationEngine {
  private packets: NetworkPacket[] = [];
  private eventLogs: SimulationEvent[] = [];
  private onPacketsUpdate?: (packets: NetworkPacket[]) => void;
  private onEventsUpdate?: (events: SimulationEvent[]) => void;
  private isPaused: boolean = false;
  private simulationSpeed: number = 1; // 1x, 2x, etc.

  constructor(
    onPacketsUpdate?: (packets: NetworkPacket[]) => void,
    onEventsUpdate?: (events: SimulationEvent[]) => void
  ) {
    this.onPacketsUpdate = onPacketsUpdate;
    this.onEventsUpdate = onEventsUpdate;
  }

  public setSpeed(speed: number) {
    this.simulationSpeed = speed;
  }

  public setPaused(paused: boolean) {
    this.isPaused = paused;
  }

  public getPackets(): NetworkPacket[] {
    return this.packets;
  }

  public getEvents(): SimulationEvent[] {
    return this.eventLogs;
  }

  public clearPackets() {
    this.packets = [];
    if (this.onPacketsUpdate) this.onPacketsUpdate(this.packets);
  }

  public clearEvents() {
    this.eventLogs = [];
    if (this.onEventsUpdate) this.onEventsUpdate(this.eventLogs);
  }

  public logEvent(
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'PACKET',
    sourceName: string,
    message: string,
    targetName?: string,
    packetId?: string
  ) {
    const event: SimulationEvent = {
      id: 'evt-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      sourceName,
      targetName,
      message,
      packetId,
    };
    this.eventLogs.unshift(event);
    if (this.eventLogs.length > 100) this.eventLogs.pop();
    if (this.onEventsUpdate) this.onEventsUpdate([...this.eventLogs]);
  }

  /**
   * Inject a Ping ICMP Echo Request from a source device to a target IP
   */
  public injectPing(
    devices: NetworkDevice[],
    cables: NetworkCable[],
    srcDeviceId: string,
    targetIp: string
  ): NetworkPacket | null {
    const srcDev = devices.find((d) => d.id === srcDeviceId);
    if (!srcDev || !srcDev.isPoweredOn) {
      this.logEvent('ERROR', srcDev?.name || 'Inconnu', 'Impossible de lancer le ping : équipement éteint.');
      return null;
    }

    // Determine source port and IP
    let srcPort = srcDev.ports.find((p) => p.isUp);
    let srcIp = srcDev.endDeviceConfig?.ipAddress || srcPort?.ipAddress;

    if (!srcPort || !srcIp) {
      this.logEvent('WARNING', srcDev.name, 'Aucune interface UP avec adresse IP configurée pour envoyer le ping.');
      return null;
    }

    // Find connected cable
    const connectedCable = cables.find(
      (c) => c.isUp && (c.sourcePortId === srcPort?.id || c.targetPortId === srcPort?.id)
    );

    if (!connectedCable) {
      this.logEvent('WARNING', srcDev.name, `Le port ${srcPort.name} n'est relié à aucun câble actif.`);
      return null;
    }

    const nextDevId =
      connectedCable.sourceDeviceId === srcDev.id
        ? connectedCable.targetDeviceId
        : connectedCable.sourceDeviceId;
    const nextPortId =
      connectedCable.sourcePortId === srcPort.id
        ? connectedCable.targetPortId
        : connectedCable.sourcePortId;

    const packetId = 'pkt-' + Math.random().toString(36).substring(2, 9);
    const initialStep: PacketStep = {
      stepIndex: 1,
      deviceId: srcDev.id,
      deviceName: srcDev.name,
      portName: srcPort.name,
      action: 'GENERATED',
      layer: 'L3',
      detail: `Génération ICMP Echo Request vers ${targetIp}.`,
    };

    const packet: NetworkPacket = {
      id: packetId,
      type: 'icmp_echo',
      srcDeviceId: srcDev.id,
      srcPortId: srcPort.id,
      dstDeviceId: nextDevId,
      dstPortId: nextPortId,
      currentLinkId: connectedCable.id,
      progress: 0,
      srcMac: srcPort.macAddress,
      dstMac: 'FF:FF:FF:FF:FF:FF', // will resolve via ARP or switch MAC table
      srcIp: srcIp,
      dstIp: targetIp,
      payload: { seq: 1, ttl: 64, data: 'abcdefghijklmnopqrstuvw' },
      status: 'in_flight',
      color: '#3b82f6', // blue
      steps: [initialStep],
    };

    this.packets.push(packet);
    this.logEvent(
      'PACKET',
      srcDev.name,
      `Transmission ICMP Echo Request -> ${targetIp} via ${srcPort.name}`,
      undefined,
      packet.id
    );

    if (this.onPacketsUpdate) this.onPacketsUpdate([...this.packets]);
    return packet;
  }

  /**
   * Step forward all active packets by delta or discrete step
   */
  public tick(
    devices: NetworkDevice[],
    cables: NetworkCable[],
    discreteStep: boolean = false
  ) {
    if (this.isPaused && !discreteStep) return;

    const delta = discreteStep ? 1.0 : 0.04 * this.simulationSpeed;
    const remainingPackets: NetworkPacket[] = [];

    for (const packet of this.packets) {
      if (packet.status !== 'in_flight') continue;

      packet.progress += delta;

      if (packet.progress >= 1.0) {
        // Packet arrived at destination device!
        packet.progress = 1.0;
        this.handlePacketArrival(packet, devices, cables, remainingPackets);
      } else {
        remainingPackets.push(packet);
      }
    }

    this.packets = remainingPackets;
    if (this.onPacketsUpdate) this.onPacketsUpdate([...this.packets]);
  }

  /**
   * Handle packet reaching the target device along a cable
   */
  private handlePacketArrival(
    packet: NetworkPacket,
    devices: NetworkDevice[],
    cables: NetworkCable[],
    nextQueue: NetworkPacket[]
  ) {
    const dstDev = devices.find((d) => d.id === packet.dstDeviceId);
    const ingressPort = dstDev?.ports.find((p) => p.id === packet.dstPortId);

    if (!dstDev || !dstDev.isPoweredOn || !ingressPort || !ingressPort.isUp) {
      packet.status = 'dropped';
      packet.dropReason = `Équipement ou port de destination inactif.`;
      this.logEvent('ERROR', dstDev?.name || 'Inconnu', `Paquet rejeté : port d'arrivée DOWN.`, undefined, packet.id);
      return;
    }

    // Record reception step
    packet.steps.push({
      stepIndex: packet.steps.length + 1,
      deviceId: dstDev.id,
      deviceName: dstDev.name,
      portName: ingressPort.name,
      action: 'RECEIVED',
      layer: 'L1',
      detail: `Arrivée du signal sur le port physique ${ingressPort.name}.`,
    });

    // 1. If Switch: perform Layer 2 Switching
    if (dstDev.category === 'switch') {
      const l2Result = processL2Switching(dstDev, ingressPort, packet);
      packet.steps.push(l2Result.step);

      if (l2Result.dropReason) {
        packet.status = 'dropped';
        packet.dropReason = l2Result.dropReason;
        this.logEvent('WARNING', dstDev.name, l2Result.dropReason, undefined, packet.id);
        return;
      }

      // Forward to egress ports
      for (const egress of l2Result.egressPorts) {
        const link = cables.find(
          (c) => c.isUp && (c.sourcePortId === egress.id || c.targetPortId === egress.id)
        );
        if (link) {
          const nextDevId = link.sourceDeviceId === dstDev.id ? link.targetDeviceId : link.sourceDeviceId;
          const nextPortId = link.sourcePortId === egress.id ? link.targetPortId : link.sourcePortId;

          const forwardedPacket: NetworkPacket = {
            ...JSON.parse(JSON.stringify(packet)),
            id: 'pkt-' + Math.random().toString(36).substring(2, 9),
            srcDeviceId: dstDev.id,
            srcPortId: egress.id,
            dstDeviceId: nextDevId,
            dstPortId: nextPortId,
            currentLinkId: link.id,
            progress: 0,
            status: 'in_flight',
          };
          nextQueue.push(forwardedPacket);
        }
      }
      return;
    }

    // 2. If Router or End Device: perform Layer 3 Routing
    const l3Result = processL3Routing(dstDev, ingressPort, packet);
    packet.steps.push(l3Result.step);

    if (l3Result.action === 'DROP') {
      packet.status = 'dropped';
      packet.dropReason = l3Result.dropReason;
      this.logEvent('WARNING', dstDev.name, l3Result.dropReason || 'Paquet rejeté par L3.', undefined, packet.id);
      return;
    }

    if (l3Result.action === 'ROUTE_FORWARD' && l3Result.egressPort) {
      // Find connected cable for egress port
      const egress = l3Result.egressPort;
      const link = cables.find(
        (c) => c.isUp && (c.sourcePortId === egress.id || c.targetPortId === egress.id)
      );

      if (link) {
        const nextDevId = link.sourceDeviceId === dstDev.id ? link.targetDeviceId : link.sourceDeviceId;
        const nextPortId = link.sourcePortId === egress.id ? link.targetPortId : link.sourcePortId;

        const routedPacket: NetworkPacket = {
          ...JSON.parse(JSON.stringify(packet)),
          id: 'pkt-' + Math.random().toString(36).substring(2, 9),
          srcDeviceId: dstDev.id,
          srcPortId: egress.id,
          dstDeviceId: nextDevId,
          dstPortId: nextPortId,
          currentLinkId: link.id,
          progress: 0,
          status: 'in_flight',
          color: '#8b5cf6', // purple for routed packet
        };
        nextQueue.push(routedPacket);
        this.logEvent(
          'INFO',
          dstDev.name,
          `Routage L3 vers ${l3Result.nextHopIp} via ${egress.name}`,
          undefined,
          routedPacket.id
        );
      }
      return;
    }

    // 3. Local Delivery (DELIVER_LOCAL)
    if (l3Result.action === 'DELIVER_LOCAL') {
      packet.status = 'delivered';
      this.logEvent(
        'SUCCESS',
        dstDev.name,
        `Paquet ${packet.type} reçu avec succès par l'hôte destinataire (${packet.dstIp}).`,
        undefined,
        packet.id
      );

      // If ICMP Echo Request, generate Echo Reply back to sender!
      if (packet.type === 'icmp_echo') {
        this.generateEchoReply(packet, dstDev, ingressPort, cables, nextQueue);
      }
    }
  }

  /**
   * Generate ICMP Echo Reply
   */
  private generateEchoReply(
    requestPacket: NetworkPacket,
    responderDev: NetworkDevice,
    ingressPort: NetworkPort,
    cables: NetworkCable[],
    nextQueue: NetworkPacket[]
  ) {
    const link = cables.find(
      (c) => c.isUp && (c.sourcePortId === ingressPort.id || c.targetPortId === ingressPort.id)
    );

    if (!link) return;

    const nextDevId = link.sourceDeviceId === responderDev.id ? link.targetDeviceId : link.sourceDeviceId;
    const nextPortId = link.sourcePortId === ingressPort.id ? link.targetPortId : link.sourcePortId;

    const replyPacket: NetworkPacket = {
      id: 'pkt-reply-' + Math.random().toString(36).substring(2, 9),
      type: 'icmp_reply',
      srcDeviceId: responderDev.id,
      srcPortId: ingressPort.id,
      dstDeviceId: nextDevId,
      dstPortId: nextPortId,
      currentLinkId: link.id,
      progress: 0,
      srcMac: ingressPort.macAddress,
      dstMac: requestPacket.srcMac,
      srcIp: requestPacket.dstIp,
      dstIp: requestPacket.srcIp,
      payload: { ...requestPacket.payload, reply: true },
      status: 'in_flight',
      color: '#10b981', // green for reply
      steps: [
        {
          stepIndex: 1,
          deviceId: responderDev.id,
          deviceName: responderDev.name,
          portName: ingressPort.name,
          action: 'GENERATED',
          layer: 'L3',
          detail: `Génération ICMP Echo Reply (TTL=64) vers ${requestPacket.srcIp}.`,
        },
      ],
    };

    nextQueue.push(replyPacket);
    this.logEvent(
      'SUCCESS',
      responderDev.name,
      `Envoi de la réponse ICMP Echo Reply -> ${requestPacket.srcIp}`,
      undefined,
      replyPacket.id
    );
  }
}

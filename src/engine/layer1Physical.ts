import { NetworkDevice, NetworkCable, NetworkPort } from '../types/network';
import { validateCableConnection, CABLE_SPECS } from '../constants/cables';

export function updatePhysicalLayer(
  devices: NetworkDevice[],
  cables: NetworkCable[]
): { updatedDevices: NetworkDevice[]; updatedCables: NetworkCable[] } {
  // Map of device lookup
  const deviceMap = new Map<string, NetworkDevice>();
  devices.forEach((d) => deviceMap.set(d.id, JSON.parse(JSON.stringify(d))));

  // Map of cable lookup
  const updatedCables: NetworkCable[] = cables.map((c) => ({ ...c }));

  // First, reset all ports' connectedLinkId and set isUp to false
  deviceMap.forEach((device) => {
    device.ports.forEach((port) => {
      port.connectedLinkId = undefined;
      port.connectedToDeviceId = undefined;
      port.connectedToPortId = undefined;
      port.isUp = false;
    });
  });

  // Evaluate each cable
  updatedCables.forEach((cable) => {
    const srcDev = deviceMap.get(cable.sourceDeviceId);
    const dstDev = deviceMap.get(cable.targetDeviceId);

    if (!srcDev || !dstDev) {
      cable.isUp = false;
      return;
    }

    const srcPort = srcDev.ports.find((p) => p.id === cable.sourcePortId);
    const dstPort = dstDev.ports.find((p) => p.id === cable.targetPortId);

    if (!srcPort || !dstPort) {
      cable.isUp = false;
      return;
    }

    // Link both ports to cable
    srcPort.connectedLinkId = cable.id;
    srcPort.connectedToDeviceId = dstDev.id;
    srcPort.connectedToPortId = dstPort.id;

    dstPort.connectedLinkId = cable.id;
    dstPort.connectedToDeviceId = srcDev.id;
    dstPort.connectedToPortId = srcPort.id;

    // Check power
    if (!srcDev.isPoweredOn || !dstDev.isPoweredOn) {
      cable.isUp = false;
      srcPort.isUp = false;
      dstPort.isUp = false;
      return;
    }

    // Check port enabled
    if (!srcPort.isEnabled || !dstPort.isEnabled) {
      cable.isUp = false;
      srcPort.isUp = false;
      dstPort.isUp = false;
      return;
    }

    // Validate cable compatibility
    const validation = validateCableConnection(
      cable.type,
      srcPort.medium,
      srcPort.type,
      dstPort.medium,
      dstPort.type,
      cable.lengthMeters,
      cable.environment
    );

    if (!validation.valid) {
      cable.isUp = false;
      cable.warning = validation.reason;
      srcPort.isUp = false;
      dstPort.isUp = false;
      return;
    }

    cable.warning = validation.warning;

    // Determine negotiated speed: min(srcPort.speed, dstPort.speed, cable.maxSpeed)
    const cableSpec = CABLE_SPECS[cable.type];
    const negotiatedSpeed = Math.min(srcPort.speed, dstPort.speed, cableSpec.maxSpeedMbps);
    cable.negotiatedSpeed = negotiatedSpeed;
    cable.duplex = 'full';
    cable.isUp = true;

    srcPort.isUp = true;
    dstPort.isUp = true;

    // PoE power simulation
    if (srcPort.poeSupported && dstPort.poeSupported) {
      dstPort.poePowerWatt = 15.4; // 802.3af standard
    }
  });

  return {
    updatedDevices: Array.from(deviceMap.values()),
    updatedCables,
  };
}

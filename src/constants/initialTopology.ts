import { NetworkDevice, NetworkCable, VendorType } from '../types/network';
import { DEVICE_CATALOG } from './catalog';
import { updatePhysicalLayer } from '../engine/layer1Physical';

export function createDeviceInstance(
  modelKey: string,
  id: string,
  name: string,
  hostname: string,
  x: number,
  y: number,
  ipConfig?: { ip: string; mask: string; gw: string; dns: string }
): NetworkDevice {
  const spec = DEVICE_CATALOG.find((s) => s.model === modelKey) || DEVICE_CATALOG[0];

  const ports = spec.ports.map((p, idx) => ({
    id: `${id}-p${idx + 1}`,
    name: p.name,
    type: p.type,
    medium: p.medium,
    isUp: false,
    isEnabled: true,
    macAddress: `00:E0:FC:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}:${Math.floor(Math.random() * 89 + 10)}`,
    speed: (p.type === '10GE' ? 10000 : p.type === 'FE' ? 100 : 1000) as 10 | 100 | 1000 | 10000,
    duplex: 'full' as const,
    vlanMode: 'access' as const,
    accessVlan: 1,
    trunkAllowedVlans: [1],
    nativeVlan: 1,
    poeSupported: p.poeSupported || false,
    ipAddress: idx === 0 && spec.category === 'router' ? '192.168.1.1' : undefined,
    subnetMask: idx === 0 && spec.category === 'router' ? '255.255.255.0' : undefined,
  }));

  return {
    id,
    name,
    hostname,
    model: spec.model,
    vendor: spec.vendor,
    category: spec.category,
    supportsWebUI: spec.supportsWebUI,
    x,
    y,
    isPoweredOn: true,
    ports,
    vlans: [{ id: 1, name: 'default', isUp: true }],
    routes: [],
    dhcpPools: [],
    macTable: [],
    arpTable: [],
    configText: `# Startup Configuration for ${hostname}\n`,
    savedConfigText: `# Startup Configuration for ${hostname}\n`,
    omadaAdopted: spec.vendor === 'omada' ? false : undefined,
    omadaSite: spec.vendor === 'omada' ? 'Default' : undefined,
    endDeviceConfig: ipConfig
      ? {
          ipMode: 'static',
          ipAddress: ipConfig.ip,
          subnetMask: ipConfig.mask,
          gateway: ipConfig.gw,
          dnsServer: ipConfig.dns,
        }
      : undefined,
  };
}

export function getDefaultTopology(vendor: VendorType): {
  devices: NetworkDevice[];
  cables: NetworkCable[];
} {
  let rtrModel = 'AR651';
  let swModel = 'S5735-L';

  if (vendor === 'cisco') {
    rtrModel = 'ISR-4321';
    swModel = 'Catalyst-2960';
  } else if (vendor === 'omada') {
    rtrModel = 'ER605';
    swModel = 'SG2008P';
  }

  const router = createDeviceInstance(
    rtrModel,
    'dev-rtr-1',
    rtrModel + '-1',
    vendor.toUpperCase() + '-R1',
    400,
    90
  );

  const sw = createDeviceInstance(
    swModel,
    'dev-sw-1',
    swModel + '-1',
    vendor.toUpperCase() + '-SW1',
    400,
    220
  );

  const pc1 = createDeviceInstance(
    'PC-Standard',
    'dev-pc-1',
    'PC-Client1',
    'PC-Client1',
    240,
    360,
    { ip: '192.168.1.10', mask: '255.255.255.0', gw: '192.168.1.1', dns: '8.8.8.8' }
  );

  const pc2 = createDeviceInstance(
    'PC-Standard',
    'dev-pc-2',
    'PC-Client2',
    'PC-Client2',
    560,
    360,
    { ip: '192.168.1.20', mask: '255.255.255.0', gw: '192.168.1.1', dns: '8.8.8.8' }
  );

  // Initial Cables
  const cable1: NetworkCable = {
    id: 'cable-rtr-sw',
    type: 'straight',
    environment: 'indoor',
    lengthMeters: 5,
    sourceDeviceId: router.id,
    sourcePortId: router.ports[0].id,
    targetDeviceId: sw.id,
    targetPortId: sw.ports[0].id,
    isUp: false,
    negotiatedSpeed: 1000,
    duplex: 'full',
    errorCount: 0,
  };

  const cable2: NetworkCable = {
    id: 'cable-sw-pc1',
    type: 'straight',
    environment: 'indoor',
    lengthMeters: 10,
    sourceDeviceId: sw.id,
    sourcePortId: sw.ports[1].id,
    targetDeviceId: pc1.id,
    targetPortId: pc1.ports[0].id,
    isUp: false,
    negotiatedSpeed: 1000,
    duplex: 'full',
    errorCount: 0,
  };

  const cable3: NetworkCable = {
    id: 'cable-sw-pc2',
    type: 'straight',
    environment: 'indoor',
    lengthMeters: 10,
    sourceDeviceId: sw.id,
    sourcePortId: sw.ports[2].id,
    targetDeviceId: pc2.id,
    targetPortId: pc2.ports[0].id,
    isUp: false,
    negotiatedSpeed: 1000,
    duplex: 'full',
    errorCount: 0,
  };

  const rawDevices = [router, sw, pc1, pc2];
  const rawCables = [cable1, cable2, cable3];

  const { updatedDevices, updatedCables } = updatePhysicalLayer(rawDevices, rawCables);

  return {
    devices: updatedDevices,
    cables: updatedCables,
  };
}

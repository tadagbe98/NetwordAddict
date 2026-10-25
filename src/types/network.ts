export type VendorType = 'huawei' | 'cisco' | 'omada';

export type DeviceCategory = 'router' | 'switch' | 'wlan' | 'end_device' | 'server' | 'cloud';

export type PortType = 'FE' | 'GE' | '10GE' | 'SFP' | 'SFP+' | 'Console' | 'Serial';

export type PortMedium = 'copper' | 'fiber' | 'serial' | 'console';

export type CableType =
  | 'straight'
  | 'crossover'
  | 'cat5'
  | 'cat6'
  | 'cat6a'
  | 'sftp'
  | 'console'
  | 'fiber'
  | 'sfp'
  | 'serial';

export type CableEnvironment = 'indoor' | 'outdoor';

export type VlanMode = 'access' | 'trunk' | 'hybrid';

export interface NetworkPort {
  id: string;
  name: string; // e.g. "GE0/0/1" or "GigabitEthernet0/1" or "Port 1"
  type: PortType;
  medium: PortMedium;
  isUp: boolean;
  isEnabled: boolean;
  macAddress: string;
  ipAddress?: string;
  subnetMask?: string;
  speed: 10 | 100 | 1000 | 10000;
  duplex: 'auto' | 'full' | 'half';
  vlanMode: VlanMode;
  accessVlan: number;
  trunkAllowedVlans: number[];
  nativeVlan: number;
  connectedLinkId?: string;
  connectedToDeviceId?: string;
  connectedToPortId?: string;
  poeSupported?: boolean;
  poePowerWatt?: number;
  rxBytes?: number;
  txBytes?: number;
}

export interface VlanConfig {
  id: number;
  name: string;
  description?: string;
  ipAddress?: string; // SVI or Vlanif IP
  subnetMask?: string;
  isUp?: boolean;
}

export interface StaticRoute {
  id: string;
  destination: string;
  mask: string;
  nextHop: string;
  interfaceName?: string;
  preference?: number; // distance
}

export interface DhcpPoolConfig {
  name: string;
  network: string;
  mask: string;
  gateway: string;
  dnsServer?: string;
  leaseTimeDays?: number;
  excludedAddresses?: string[];
}

export interface MacTableEntry {
  mac: string;
  vlanId: number;
  portId: string;
  portName: string;
  type: 'DYNAMIC' | 'STATIC';
  age: number;
}

export interface ArpTableEntry {
  ip: string;
  mac: string;
  portName: string;
  type: 'DYNAMIC' | 'STATIC';
}

export interface DnsRecord {
  domain: string;
  ip: string;
  type: 'A' | 'CNAME';
}

export interface ServerServices {
  http: {
    enabled: boolean;
    port: number;
    title: string;
    contentHtml: string;
  };
  dns: {
    enabled: boolean;
    records: DnsRecord[];
  };
  dhcp: {
    enabled: boolean;
    pools: DhcpPoolConfig[];
  };
}

export interface EndDeviceConfig {
  ipMode: 'static' | 'dhcp';
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  dnsServer: string;
}

export interface DeviceModelSpec {
  model: string;
  vendor: VendorType | 'generic';
  category: DeviceCategory;
  name: string;
  description: string;
  ports: {
    name: string;
    type: PortType;
    medium: PortMedium;
    count: number;
    poeSupported?: boolean;
  }[];
  layer: 2 | 3;
  supportsCli: boolean;
  supportsWebUI: boolean;
  osName: string;
  iconName: string;
}

export interface NetworkDevice {
  id: string;
  name: string;
  hostname: string;
  model: string;
  vendor: VendorType | 'generic';
  category: DeviceCategory;
  x: number;
  y: number;
  isPoweredOn: boolean;
  ports: NetworkPort[];
  vlans: VlanConfig[];
  routes: StaticRoute[];
  dhcpPools: DhcpPoolConfig[];
  macTable: MacTableEntry[];
  arpTable: ArpTableEntry[];
  configText: string;
  savedConfigText: string;
  endDeviceConfig?: EndDeviceConfig;
  serverServices?: ServerServices;
  omadaAdopted?: boolean;
  omadaSite?: string;
  webCredentials?: { username: string; passwordHash: string };
  isWebConfigured?: boolean;
  supportsWebUI?: boolean;
}

export interface NetworkCable {
  id: string;
  type: CableType;
  environment: CableEnvironment;
  lengthMeters: number;
  sourceDeviceId: string;
  sourcePortId: string;
  targetDeviceId: string;
  targetPortId: string;
  isUp: boolean;
  negotiatedSpeed: number;
  duplex: 'full' | 'half';
  errorCount: number;
  warning?: string;
}

export interface PacketStep {
  stepIndex: number;
  deviceId: string;
  deviceName: string;
  portName: string;
  action: 'RECEIVED' | 'FORWARDED' | 'ROUTED' | 'SWITCHED' | 'DROPPED' | 'GENERATED';
  detail: string;
  layer: 'L1' | 'L2' | 'L3' | 'L4' | 'L7';
}

export type PacketType =
  | 'arp_request'
  | 'arp_reply'
  | 'icmp_echo'
  | 'icmp_reply'
  | 'dhcp_discover'
  | 'dhcp_offer'
  | 'dhcp_request'
  | 'dhcp_ack'
  | 'http_request'
  | 'http_response'
  | 'dns_query'
  | 'dns_response';

export interface NetworkPacket {
  id: string;
  type: PacketType;
  srcDeviceId: string;
  srcPortId: string;
  dstDeviceId: string;
  dstPortId: string;
  currentLinkId?: string;
  progress: number; // 0 to 1 along cable
  srcMac: string;
  dstMac: string;
  srcIp: string;
  dstIp: string;
  vlanId?: number;
  payload: Record<string, any>;
  status: 'in_flight' | 'delivered' | 'dropped';
  dropReason?: string;
  color: string;
  steps: PacketStep[];
}

export type SimulationMode = 'select' | 'cable' | 'simulate';

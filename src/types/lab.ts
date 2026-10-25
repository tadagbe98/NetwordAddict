import { NetworkDevice, NetworkCable, VendorType } from './network';

export type LabDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface LabObjective {
  id: string;
  title: string;
  description: string;
  hint: string;
  points: number;
  isCompleted: boolean;
  validationType:
    | 'ping_success'
    | 'vlan_exists'
    | 'port_vlan_assigned'
    | 'interface_ip_configured'
    | 'static_route_exists'
    | 'dhcp_pool_configured'
    | 'web_configured'
    | 'omada_ssid_created';
  params: Record<string, any>;
}

export interface LabScenario {
  id: string;
  vendor: VendorType;
  title: string;
  category: string;
  difficulty: LabDifficulty;
  timeEstimateMinutes: number;
  description: string;
  backgroundStory: string;
  initialDevices: Partial<NetworkDevice>[];
  initialCables: Partial<NetworkCable>[];
  objectives: LabObjective[];
}

export interface LabProgress {
  labId: string;
  completedObjectives: string[];
  score: number;
  totalPoints: number;
  isFullyCompleted: boolean;
  lastTestedAt?: string;
}

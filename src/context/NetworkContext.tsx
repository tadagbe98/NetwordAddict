import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  VendorType,
  NetworkDevice,
  NetworkCable,
  NetworkPacket,
  SimulationMode,
  CableType,
  CableEnvironment,
} from '../types/network';
import { CliSession } from '../types/cli';
import { LabScenario, LabProgress } from '../types/lab';
import { DEVICE_CATALOG } from '../constants/catalog';
import { DEFAULT_LABS } from '../constants/defaultLabs';
import { getDefaultTopology, createDeviceInstance } from '../constants/initialTopology';
import { updatePhysicalLayer } from '../engine/layer1Physical';
import { SimulationEngine, SimulationEvent } from '../engine/simulationEngine';
import confetti from 'canvas-confetti';

interface NetworkContextType {
  vendor: VendorType;
  setVendor: (v: VendorType) => void;
  devices: NetworkDevice[];
  cables: NetworkCable[];
  packets: NetworkPacket[];
  mode: SimulationMode;
  setMode: (m: SimulationMode) => void;
  selectedCableType: CableType;
  setSelectedCableType: (c: CableType) => void;
  selectedCableEnv: CableEnvironment;
  setSelectedCableEnv: (e: CableEnvironment) => void;
  selectedCableLength: number;
  setSelectedCableLength: (l: number) => void;
  selectedDeviceId: string | null;
  setSelectedDeviceId: (id: string | null) => void;

  // Modals & Panels
  activeTerminalId: string | null;
  setActiveTerminalId: (id: string | null) => void;
  activeWebUIId: string | null;
  setActiveWebUIId: (id: string | null) => void;
  activePcId: string | null;
  setActivePcId: (id: string | null) => void;
  activeServerId: string | null;
  setActiveServerId: (id: string | null) => void;
  inspectedPacket: NetworkPacket | null;
  setInspectedPacket: (p: NetworkPacket | null) => void;
  isEventLogOpen: boolean;
  setIsEventLogOpen: (open: boolean) => void;
  isLabsOpen: boolean;
  setIsLabsOpen: (open: boolean) => void;
  isVendorModalOpen: boolean;
  setIsVendorModalOpen: (open: boolean) => void;

  // Actions
  addDevice: (modelKey: string, x: number, y: number) => NetworkDevice | null;
  updateDevice: (id: string, partial: Partial<NetworkDevice>) => void;
  removeDevice: (id: string) => void;
  toggleDevicePower: (id: string) => void;
  connectCable: (
    srcDevId: string,
    srcPortId: string,
    dstDevId: string,
    dstPortId: string,
    cableType?: CableType,
    env?: CableEnvironment,
    length?: number
  ) => { success: boolean; error?: string };
  removeCable: (cableId: string) => void;

  // Terminal Sessions
  sessions: Record<string, CliSession>;
  setSessions: React.Dispatch<React.SetStateAction<Record<string, CliSession>>>;

  // Simulation Controls
  isSimPaused: boolean;
  setIsSimPaused: (p: boolean) => void;
  simulationSpeed: number;
  setSimulationSpeed: (s: number) => void;
  stepSimulation: () => void;
  clearPackets: () => void;
  events: SimulationEvent[];
  injectPing: (srcDeviceId: string, targetIp: string) => void;

  // Labs
  activeLab: LabScenario | null;
  labProgress: LabProgress | null;
  loadLab: (labId: string) => void;
  verifyLab: () => { passed: boolean; message: string };
  resetCurrentLab: () => void;

  // Project persistence
  newProject: (newVendor: VendorType) => void;
  exportProjectJson: () => string;
  importProjectJson: (jsonString: string) => boolean;
  exportConfigurationsText: () => string;
  clearCanvas: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vendor, setVendor] = useState<VendorType>('huawei');

  // Initialize with immediate default topology to eliminate any load delay
  const initialNetwork = useRef(getDefaultTopology('huawei'));

  const [devices, setDevices] = useState<NetworkDevice[]>(initialNetwork.current.devices);
  const [cables, setCables] = useState<NetworkCable[]>(initialNetwork.current.cables);
  const [packets, setPackets] = useState<NetworkPacket[]>([]);
  const [mode, setMode] = useState<SimulationMode>('select');

  // Cable options
  const [selectedCableType, setSelectedCableType] = useState<CableType>('straight');
  const [selectedCableEnv, setSelectedCableEnv] = useState<CableEnvironment>('indoor');
  const [selectedCableLength, setSelectedCableLength] = useState<number>(10);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  // Modals
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);
  const [activeWebUIId, setActiveWebUIId] = useState<string | null>(null);
  const [activePcId, setActivePcId] = useState<string | null>(null);
  const [activeServerId, setActiveServerId] = useState<string | null>(null);
  const [inspectedPacket, setInspectedPacket] = useState<NetworkPacket | null>(null);
  const [isEventLogOpen, setIsEventLogOpen] = useState<boolean>(false);
  const [isLabsOpen, setIsLabsOpen] = useState<boolean>(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState<boolean>(false);

  // Simulation state
  const [isSimPaused, setIsSimPaused] = useState<boolean>(false);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1);
  const [events, setEvents] = useState<SimulationEvent[]>([]);

  // Terminal sessions
  const [sessions, setSessions] = useState<Record<string, CliSession>>({});

  // Labs
  const [activeLab, setActiveLab] = useState<LabScenario | null>(null);
  const [labProgress, setLabProgress] = useState<LabProgress | null>(null);

  // Engine instance
  const engineRef = useRef<SimulationEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new SimulationEngine(
      (newPkts) => setPackets(newPkts),
      (newEvts) => setEvents(newEvts)
    );
  }

  // Ref to always access current devices/cables inside ticker without re-triggering effects
  const devicesRef = useRef(devices);
  devicesRef.current = devices;
  const cablesRef = useRef(cables);
  cablesRef.current = cables;

  // Real-time animation ticker
  useEffect(() => {
    if (packets.length === 0) return;

    const interval = setInterval(() => {
      if (engineRef.current && !isSimPaused) {
        engineRef.current.tick(devicesRef.current, cablesRef.current, false);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [packets.length, isSimPaused]);

  // Clean updater for topology
  const applyTopology = useCallback(
    (newDevs: NetworkDevice[], newCables: NetworkCable[]) => {
      const { updatedDevices, updatedCables } = updatePhysicalLayer(newDevs, newCables);
      setDevices(updatedDevices);
      setCables(updatedCables);
    },
    []
  );

  // Add device helper
  const addDevice = useCallback(
    (modelKey: string, x: number, y: number): NetworkDevice | null => {
      const spec = DEVICE_CATALOG.find((s) => s.model === modelKey);
      if (!spec) return null;

      const currentDevs = devicesRef.current;
      const id = 'dev-' + Math.random().toString(36).substring(2, 9);
      const existingSameModel = currentDevs.filter((d) => d.model === spec.model).length;
      const name = `${spec.model}-${existingSameModel + 1}`;
      const hostname = `${spec.vendor.toUpperCase()}-${spec.category.substring(0, 2).toUpperCase()}${existingSameModel + 1}`;

      const newDev = createDeviceInstance(spec.model, id, name, hostname, x, y);

      const nextDevs = [...currentDevs, newDev];
      applyTopology(nextDevs, cablesRef.current);
      return newDev;
    },
    [applyTopology]
  );

  // Update device helper
  const updateDevice = useCallback(
    (id: string, partial: Partial<NetworkDevice>) => {
      const currentDevs = devicesRef.current;
      const nextDevs = currentDevs.map((d) => (d.id === id ? { ...d, ...partial } : d));
      applyTopology(nextDevs, cablesRef.current);
    },
    [applyTopology]
  );

  // Remove device helper
  const removeDevice = useCallback(
    (id: string) => {
      const currentDevs = devicesRef.current;
      const nextDevs = currentDevs.filter((d) => d.id !== id);
      const nextCables = cablesRef.current.filter(
        (c) => c.sourceDeviceId !== id && c.targetDeviceId !== id
      );
      applyTopology(nextDevs, nextCables);
    },
    [applyTopology]
  );

  // Toggle device power
  const toggleDevicePower = useCallback(
    (id: string) => {
      const currentDevs = devicesRef.current;
      const nextDevs = currentDevs.map((d) =>
        d.id === id ? { ...d, isPoweredOn: !d.isPoweredOn } : d
      );
      applyTopology(nextDevs, cablesRef.current);
    },
    [applyTopology]
  );

  // Connect cable
  const connectCable = useCallback(
    (
      srcDevId: string,
      srcPortId: string,
      dstDevId: string,
      dstPortId: string,
      cableType: CableType = selectedCableType,
      env: CableEnvironment = selectedCableEnv,
      length: number = selectedCableLength
    ) => {
      if (srcDevId === dstDevId) {
        return { success: false, error: 'Impossible de relier un équipement à lui-même.' };
      }

      const currentCables = cablesRef.current;
      const existing = currentCables.find(
        (c) =>
          c.sourcePortId === srcPortId ||
          c.targetPortId === srcPortId ||
          c.sourcePortId === dstPortId ||
          c.targetPortId === dstPortId
      );
      if (existing) {
        return { success: false, error: "L'un des ports sélectionnés est déjà branché !" };
      }

      const newCable: NetworkCable = {
        id: 'cable-' + Math.random().toString(36).substring(2, 9),
        type: cableType,
        environment: env,
        lengthMeters: length,
        sourceDeviceId: srcDevId,
        sourcePortId: srcPortId,
        targetDeviceId: dstDevId,
        targetPortId: dstPortId,
        isUp: false,
        negotiatedSpeed: 1000,
        duplex: 'full',
        errorCount: 0,
      };

      const nextCables = [...currentCables, newCable];
      applyTopology(devicesRef.current, nextCables);

      engineRef.current?.logEvent(
        'INFO',
        'Topologie',
        `Câble ${cableType.toUpperCase()} connecté (${length}m, ${env}).`
      );

      return { success: true };
    },
    [selectedCableType, selectedCableEnv, selectedCableLength, applyTopology]
  );

  // Remove cable
  const removeCable = useCallback(
    (cableId: string) => {
      const nextCables = cablesRef.current.filter((c) => c.id !== cableId);
      applyTopology(devicesRef.current, nextCables);
    },
    [applyTopology]
  );

  const stepSimulation = useCallback(() => {
    engineRef.current?.tick(devicesRef.current, cablesRef.current, true);
  }, []);

  const clearPackets = useCallback(() => {
    engineRef.current?.clearPackets();
  }, []);

  const injectPing = useCallback(
    (srcDeviceId: string, targetIp: string) => {
      engineRef.current?.injectPing(devicesRef.current, cablesRef.current, srcDeviceId, targetIp);
    },
    []
  );

  // Labs
  const loadLab = useCallback(
    (labId: string) => {
      const lab = DEFAULT_LABS.find((l) => l.id === labId);
      if (!lab) return;

      setVendor(lab.vendor);
      setActiveLab(lab);
      setLabProgress({
        labId: lab.id,
        completedObjectives: [],
        score: 0,
        totalPoints: lab.objectives.reduce((acc, o) => acc + o.points, 0),
        isFullyCompleted: false,
      });

      const newDevs: NetworkDevice[] = lab.initialDevices.map((d, index) => {
        const spec = DEVICE_CATALOG.find((s) => s.model === d.model) || DEVICE_CATALOG[0];
        const id = d.id || `lab-dev-${index + 1}`;
        const dev = createDeviceInstance(
          spec.model,
          id,
          d.name || spec.name,
          d.hostname || spec.model,
          d.x || 300,
          d.y || 200,
          d.endDeviceConfig
            ? {
                ip: d.endDeviceConfig.ipAddress,
                mask: d.endDeviceConfig.subnetMask,
                gw: d.endDeviceConfig.gateway,
                dns: d.endDeviceConfig.dnsServer,
              }
            : undefined
        );
        return dev;
      });

      applyTopology(newDevs, []);
      setIsLabsOpen(true);
    },
    [applyTopology]
  );

  const verifyLab = useCallback((): { passed: boolean; message: string } => {
    if (!activeLab) return { passed: false, message: 'Aucun atelier sélectionné.' };

    const currentDevs = devicesRef.current;
    const currentCables = cablesRef.current;
    const completed: string[] = [];
    let score = 0;

    activeLab.objectives.forEach((obj) => {
      let passed = false;

      if (obj.validationType === 'vlan_exists') {
        const dev = currentDevs.find((d) => d.id === obj.params.deviceId);
        if (dev && dev.vlans.some((v) => v.id === obj.params.vlanId)) {
          passed = true;
        }
      } else if (obj.validationType === 'port_vlan_assigned') {
        const dev = currentDevs.find((d) => d.id === obj.params.deviceId);
        if (dev) {
          const port = dev.ports.find((p) => p.name === obj.params.portName);
          if (port && port.accessVlan === obj.params.vlanId) {
            passed = true;
          }
        }
      } else if (obj.validationType === 'interface_ip_configured') {
        const dev = currentDevs.find((d) => d.id === obj.params.deviceId);
        if (dev) {
          const port = dev.ports.find((p) => p.name === obj.params.portName);
          if (port && port.ipAddress === obj.params.ip) {
            passed = true;
          }
        }
      } else if (obj.validationType === 'web_configured') {
        const dev = currentDevs.find((d) => d.id === obj.params.deviceId);
        if (dev && (dev.omadaAdopted || dev.isWebConfigured)) {
          passed = true;
        }
      } else if (obj.validationType === 'omada_ssid_created') {
        const oc = currentDevs.find((d) => d.model === 'OC200');
        if (oc?.isWebConfigured) passed = true;
      } else if (obj.validationType === 'ping_success') {
        const cableExists = currentCables.some((c) => c.isUp);
        if (cableExists) passed = true;
      }

      if (passed) {
        completed.push(obj.id);
        score += obj.points;
      }
    });

    const isFully = completed.length === activeLab.objectives.length;
    setLabProgress({
      labId: activeLab.id,
      completedObjectives: completed,
      score,
      totalPoints: activeLab.objectives.reduce((acc, o) => acc + o.points, 0),
      isFullyCompleted: isFully,
      lastTestedAt: new Date().toLocaleTimeString(),
    });

    if (isFully) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    return {
      passed: isFully,
      message: isFully
        ? 'Bravo ! Toutes les conditions de validation sont remplies !'
        : `${completed.length}/${activeLab.objectives.length} objectifs validés. Score : ${score} pts.`,
    };
  }, [activeLab]);

  const resetCurrentLab = useCallback(() => {
    if (activeLab) loadLab(activeLab.id);
  }, [activeLab, loadLab]);

  // New Project
  const newProject = useCallback(
    (newVendor: VendorType) => {
      setVendor(newVendor);
      const defaultTopo = getDefaultTopology(newVendor);
      setDevices(defaultTopo.devices);
      setCables(defaultTopo.cables);
      setPackets([]);
      setSessions({});
      setActiveLab(null);
      setLabProgress(null);
      setIsVendorModalOpen(false);
    },
    []
  );

  const clearCanvas = useCallback(() => {
    setDevices([]);
    setCables([]);
    setPackets([]);
  }, []);

  const exportProjectJson = useCallback((): string => {
    return JSON.stringify(
      {
        version: '1.0',
        timestamp: new Date().toISOString(),
        vendor,
        devices: devicesRef.current,
        cables: cablesRef.current,
      },
      null,
      2
    );
  }, [vendor]);

  const importProjectJson = useCallback(
    (jsonString: string): boolean => {
      try {
        const parsed = JSON.parse(jsonString);
        if (!parsed.devices || !parsed.cables) return false;
        if (parsed.vendor) setVendor(parsed.vendor);
        applyTopology(parsed.devices, parsed.cables);
        return true;
      } catch {
        return false;
      }
    },
    [applyTopology]
  );

  const exportConfigurationsText = useCallback((): string => {
    let out = `# ===========================================\n`;
    out += `# NetSim Pro - Multi-Vendor Topology Export\n`;
    out += `# Date: ${new Date().toLocaleString()}\n`;
    out += `# Vendor: ${vendor.toUpperCase()}\n`;
    out += `# ===========================================\n\n`;

    devicesRef.current.forEach((d) => {
      out += `\n#############################################\n`;
      out += `## DEVICE: ${d.name} (${d.model})\n`;
      out += `## HOSTNAME: ${d.hostname}\n`;
      out += `#############################################\n`;
      out += d.savedConfigText || d.configText || `# No configuration saved\n`;
    });

    return out;
  }, [vendor]);

  return (
    <NetworkContext.Provider
      value={{
        vendor,
        setVendor,
        devices,
        cables,
        packets,
        mode,
        setMode,
        selectedCableType,
        setSelectedCableType,
        selectedCableEnv,
        setSelectedCableEnv,
        selectedCableLength,
        setSelectedCableLength,
        selectedDeviceId,
        setSelectedDeviceId,
        activeTerminalId,
        setActiveTerminalId,
        activeWebUIId,
        setActiveWebUIId,
        activePcId,
        setActivePcId,
        activeServerId,
        setActiveServerId,
        inspectedPacket,
        setInspectedPacket,
        isEventLogOpen,
        setIsEventLogOpen,
        isLabsOpen,
        setIsLabsOpen,
        isVendorModalOpen,
        setIsVendorModalOpen,
        addDevice,
        updateDevice,
        removeDevice,
        toggleDevicePower,
        connectCable,
        removeCable,
        sessions,
        setSessions,
        isSimPaused,
        setIsSimPaused,
        simulationSpeed,
        setSimulationSpeed,
        stepSimulation,
        clearPackets,
        events,
        injectPing,
        activeLab,
        labProgress,
        loadLab,
        verifyLab,
        resetCurrentLab,
        newProject,
        exportProjectJson,
        importProjectJson,
        exportConfigurationsText,
        clearCanvas,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

export type Language = 'fr' | 'en';

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  project: string;
  newProject: string;
  saveProject: string;
  exportProject: string;
  importProject: string;
  exportConfig: string;
  clearCanvas: string;
  vendorSelection: string;
  chooseEcosystem: string;
  vendorHuaweiDesc: string;
  vendorCiscoDesc: string;
  vendorOmadaDesc: string;
  startWithVendor: string;
  modes: {
    select: string;
    cable: string;
    simulate: string;
  };
  sidebar: {
    devices: string;
    cables: string;
    searchPlaceholder: string;
    categories: {
      routers: string;
      switches: string;
      wlan: string;
      endDevices: string;
      cloud: string;
    };
    cablesList: {
      straight: string;
      crossover: string;
      cat5: string;
      cat6: string;
      cat6a: string;
      sftp: string;
      fiber: string;
      sfp: string;
      console: string;
      serial: string;
    };
    cableEnvironment: string;
    indoor: string;
    outdoor: string;
    cableLength: string;
  };
  deviceActions: {
    powerOn: string;
    powerOff: string;
    openCli: string;
    openWebUI: string;
    configure: string;
    delete: string;
    inspect: string;
    status: string;
    disconnect: string;
  };
  terminal: {
    tabs: string;
    clear: string;
    disconnect: string;
    helpHint: string;
  };
  webui: {
    title: string;
    dashboard: string;
    interfaces: string;
    vlans: string;
    routing: string;
    dhcp: string;
    nat: string;
    system: string;
    saveConfig: string;
    statusUp: string;
    statusDown: string;
    applyChanges: string;
    omadaTitle: string;
    omadaSites: string;
    omadaDevices: string;
    omadaClients: string;
    omadaWireless: string;
    omadaNetworks: string;
    omadaPoe: string;
    adoptDevice: string;
  };
  simulation: {
    realtime: string;
    stepByStep: string;
    play: string;
    pause: string;
    step: string;
    speed: string;
    eventLog: string;
    packetInspector: string;
    clearPackets: string;
  };
  labs: {
    title: string;
    guidedLabs: string;
    objectives: string;
    verify: string;
    hints: string;
    congratulations: string;
    labSuccess: string;
    progress: string;
    resetLab: string;
  };
  pc: {
    cmdPrompt: string;
    browser: string;
    ipSettings: string;
    pingTest: string;
  };
}

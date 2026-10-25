import React from 'react';
import { I18nProvider } from './context/I18nContext';
import { NetworkProvider } from './context/NetworkContext';
import { TopNav } from './components/header/TopNav';
import { ProjectVendorModal } from './components/header/ProjectVendorModal';
import { DevicePalette } from './components/sidebar/DevicePalette';
import { CableSelector } from './components/sidebar/CableSelector';
import { NetworkCanvas } from './components/canvas/NetworkCanvas';
import { TerminalModal } from './components/terminal/TerminalModal';
import { WebUIModal } from './components/webui/WebUIModal';
import { PcDesktopModal } from './components/enddevice/PcDesktopModal';
import { ServerConfigModal } from './components/enddevice/ServerConfigModal';
import { PacketInspectorModal } from './components/packetengine/PacketInspectorModal';
import { EventLogDrawer } from './components/packetengine/EventLogDrawer';
import { GuidedLabsDrawer } from './components/labs/GuidedLabsDrawer';

const AppLayout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation */}
      <TopNav />

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar: Device Catalog */}
        <DevicePalette />

        {/* Cable Options Bar (visible in Cabling mode) */}
        <CableSelector />

        {/* Interactive Topo Canvas */}
        <NetworkCanvas />

        {/* Guided Labs Drawer */}
        <GuidedLabsDrawer />

        {/* Real-Time Simulation Event Log Drawer */}
        <EventLogDrawer />
      </div>

      {/* Floating Modals */}
      <ProjectVendorModal />
      <TerminalModal />
      <WebUIModal />
      <PcDesktopModal />
      <ServerConfigModal />
      <PacketInspectorModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <I18nProvider>
      <NetworkProvider>
        <AppLayout />
      </NetworkProvider>
    </I18nProvider>
  );
};

export default App;

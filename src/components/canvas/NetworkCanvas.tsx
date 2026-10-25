import React, { useState, useRef, useCallback } from 'react';
import { useNetwork } from '../../context/NetworkContext';
import { NetworkDevice, NetworkCable, NetworkPort, NetworkPacket } from '../../types/network';
import { DeviceNode } from './DeviceNode';
import { CableLink } from './CableLink';
import { PacketCanvas } from './PacketCanvas';
import { ContextMenu } from './ContextMenu';
import { MiniMap } from './MiniMap';

export const NetworkCanvas: React.FC = () => {
  const {
    devices,
    cables,
    packets,
    mode,
    connectCable,
    updateDevice,
    selectedDeviceId,
    setSelectedDeviceId,
    setInspectedPacket,
  } = useNetwork();

  // Canvas Pan & Zoom
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Dragging device
  const [draggingDevId, setDraggingDevId] = useState<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  // Cabling mode selection state
  const [cablingSrc, setCablingSrc] = useState<{
    deviceId: string;
    portId: string;
  } | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    device?: NetworkDevice;
    cable?: NetworkCable;
  }>({ isOpen: false, x: 0, y: 0 });

  // Handle Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.4), 2.2));
  };

  // Handle Canvas Mouse Down (Panning or Deselection)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.target === e.currentTarget)) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      setSelectedDeviceId(null);
      setContextMenu({ isOpen: false, x: 0, y: 0 });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
      return;
    }

    if (draggingDevId) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const clientX = e.clientX;
      const clientY = e.clientY;

      rafRef.current = requestAnimationFrame(() => {
        const newX = Math.round((clientX - pan.x) / zoom - dragOffsetRef.current.x);
        const newY = Math.round((clientY - pan.y) / zoom - dragOffsetRef.current.y);
        updateDevice(draggingDevId, { x: newX, y: newY });
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingDevId(null);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  // Device Drag Start
  const handleDeviceMouseDown = (e: React.MouseEvent, device: NetworkDevice) => {
    if (e.button !== 0) return; // Only primary button
    e.stopPropagation();
    setContextMenu({ isOpen: false, x: 0, y: 0 });
    setSelectedDeviceId(device.id);

    setDraggingDevId(device.id);
    dragOffsetRef.current = {
      x: (e.clientX - pan.x) / zoom - device.x,
      y: (e.clientY - pan.y) / zoom - device.y,
    };
  };

  // Handle Port Click in Cabling Mode
  const handlePortClick = (device: NetworkDevice, port: NetworkPort) => {
    if (mode !== 'cable') {
      setSelectedDeviceId(device.id);
      return;
    }

    if (!cablingSrc) {
      setCablingSrc({ deviceId: device.id, portId: port.id });
    } else {
      if (cablingSrc.deviceId === device.id) {
        setCablingSrc(null);
        return;
      }

      const res = connectCable(cablingSrc.deviceId, cablingSrc.portId, device.id, port.id);
      if (!res.success) {
        alert(res.error || 'Erreur lors du raccordement.');
      }
      setCablingSrc(null);
    }
  };

  // Right Click handlers
  const handleDeviceContextMenu = (e: React.MouseEvent, device: NetworkDevice) => {
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      device,
    });
  };

  const handleCableContextMenu = (e: React.MouseEvent, cable: NetworkCable) => {
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      cable,
    });
  };

  const handlePacketClick = (packet: NetworkPacket) => {
    setInspectedPacket(packet);
  };

  return (
    <div
      className="flex-1 h-[calc(100vh-3.5rem)] relative overflow-hidden bg-slate-950 cursor-crosshair select-none"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onClick={() => {
        setContextMenu({ isOpen: false, x: 0, y: 0 });
      }}
    >
      {/* Background Dot Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(#64748b 1px, transparent 1px)`,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      {/* Cabling Mode Instruction Banner */}
      {mode === 'cable' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur flex items-center space-x-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>
            {cablingSrc
              ? "Sélectionnez maintenant le port de l'équipement destination..."
              : 'Cliquez sur le premier port pour débuter la liaison par câble.'}
          </span>
        </div>
      )}

      {/* Main Zoomed & Panned Content Container */}
      <div
        className="absolute inset-0 origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* SVG Layer for Cables and Animated Packets */}
        <svg
          className="absolute inset-0 overflow-visible w-full h-full pointer-events-none"
        >
          {/* Cables */}
          <g className="pointer-events-auto">
            {cables.map((cable) => (
              <CableLink
                key={cable.id}
                cable={cable}
                devices={devices}
                onContextMenu={handleCableContextMenu}
              />
            ))}
          </g>

          {/* Traveling Packets */}
          <g className="pointer-events-auto">
            <PacketCanvas
              packets={packets}
              devices={devices}
              cables={cables}
              onPacketClick={handlePacketClick}
            />
          </g>
        </svg>

        {/* HTML Layer for Device Nodes */}
        {devices.map((device) => (
          <DeviceNode
            key={device.id}
            device={device}
            isSelected={selectedDeviceId === device.id}
            selectedPortId={cablingSrc?.deviceId === device.id ? cablingSrc.portId : null}
            onSelect={(dev) => setSelectedDeviceId(dev.id)}
            onPortClick={handlePortClick}
            onContextMenu={handleDeviceContextMenu}
            onMouseDown={handleDeviceMouseDown}
          />
        ))}
      </div>

      {/* MiniMap */}
      <MiniMap
        devices={devices}
        cables={cables}
        viewportX={pan.x}
        viewportY={pan.y}
        zoom={zoom}
      />

      {/* Context Menu */}
      {contextMenu.isOpen && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          device={contextMenu.device}
          cable={contextMenu.cable}
          onClose={() => setContextMenu({ isOpen: false, x: 0, y: 0 })}
        />
      )}
    </div>
  );
};

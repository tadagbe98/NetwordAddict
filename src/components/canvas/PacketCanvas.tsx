import React from 'react';
import { NetworkPacket, NetworkDevice, NetworkCable } from '../../types/network';
import { Mail } from 'lucide-react';

interface PacketCanvasProps {
  packets: NetworkPacket[];
  devices: NetworkDevice[];
  cables: NetworkCable[];
  onPacketClick: (packet: NetworkPacket) => void;
}

export const PacketCanvas: React.FC<PacketCanvasProps> = ({
  packets,
  devices,
  cables,
  onPacketClick,
}) => {
  return (
    <g className="packets-layer">
      {packets.map((packet) => {
        if (packet.status !== 'in_flight') return null;

        const cable = cables.find((c) => c.id === packet.currentLinkId);
        if (!cable) return null;

        const srcDev = devices.find((d) => d.id === packet.srcDeviceId);
        const dstDev = devices.find((d) => d.id === packet.dstDeviceId);
        if (!srcDev || !dstDev) return null;

        // Device centers
        const x1 = srcDev.x + 70;
        const y1 = srcDev.y + 40;
        const x2 = dstDev.x + 70;
        const y2 = dstDev.y + 40;

        // Current coordinates based on progress (0 -> 1)
        const currentX = x1 + (x2 - x1) * packet.progress;
        const currentY = y1 + (y2 - y1) * packet.progress;

        return (
          <g
            key={packet.id}
            transform={`translate(${currentX}, ${currentY})`}
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onPacketClick(packet);
            }}
          >
            {/* Pulsing aura */}
            <circle
              r={12}
              fill={packet.color}
              opacity={0.3}
              className="animate-ping"
            />

            {/* Background pill */}
            <circle
              r={9}
              fill={packet.color}
              stroke="#ffffff"
              strokeWidth={1.5}
              className="shadow-lg"
            />

            {/* Packet type label floating */}
            <text
              y={-14}
              fill="#ffffff"
              fontSize={10}
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
              className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
            >
              {packet.type.toUpperCase()}
            </text>
          </g>
        );
      })}
    </g>
  );
};

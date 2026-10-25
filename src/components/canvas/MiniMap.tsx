import React from 'react';
import { NetworkDevice, NetworkCable } from '../../types/network';

interface MiniMapProps {
  devices: NetworkDevice[];
  cables: NetworkCable[];
  viewportX: number;
  viewportY: number;
  zoom: number;
}

export const MiniMap: React.FC<MiniMapProps> = ({ devices, cables }) => {
  if (devices.length === 0) return null;

  // Compute bounding box
  const minX = Math.min(...devices.map((d) => d.x), 0);
  const maxX = Math.max(...devices.map((d) => d.x + 140), 1000);
  const minY = Math.min(...devices.map((d) => d.y), 0);
  const maxY = Math.max(...devices.map((d) => d.y + 80), 700);

  const width = maxX - minX + 200;
  const height = maxY - minY + 200;

  const mapW = 160;
  const mapH = 100;

  const scaleX = mapW / Math.max(width, 1);
  const scaleY = mapH / Math.max(height, 1);
  const scale = Math.min(scaleX, scaleY);

  return (
    <div className="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-xl p-1.5 shadow-xl select-none z-10">
      <div className="text-[9px] font-mono font-bold text-slate-400 mb-1 px-1">MINI-MAP</div>
      <svg
        width={mapW}
        height={mapH}
        className="bg-slate-950 rounded-lg border border-slate-800"
      >
        {/* Render Cables */}
        {cables.map((cable) => {
          const s = devices.find((d) => d.id === cable.sourceDeviceId);
          const t = devices.find((d) => d.id === cable.targetDeviceId);
          if (!s || !t) return null;
          return (
            <line
              key={cable.id}
              x1={(s.x - minX + 70) * scale}
              y1={(s.y - minY + 40) * scale}
              x2={(t.x - minX + 70) * scale}
              y2={(t.y - minY + 40) * scale}
              stroke={cable.isUp ? '#3b82f6' : '#64748b'}
              strokeWidth={1}
            />
          );
        })}

        {/* Render Devices */}
        {devices.map((dev) => (
          <rect
            key={dev.id}
            x={(dev.x - minX) * scale}
            y={(dev.y - minY) * scale}
            width={140 * scale}
            height={80 * scale}
            rx={2}
            fill={dev.category === 'router' ? '#3b82f6' : dev.category === 'switch' ? '#10b981' : '#f59e0b'}
            opacity={0.8}
          />
        ))}
      </svg>
    </div>
  );
};

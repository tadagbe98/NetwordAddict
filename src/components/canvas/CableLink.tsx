import React from 'react';
import { NetworkCable, NetworkDevice } from '../../types/network';
import { CABLE_SPECS } from '../../constants/cables';

interface CableLinkProps {
  cable: NetworkCable;
  devices: NetworkDevice[];
  onContextMenu: (e: React.MouseEvent, cable: NetworkCable) => void;
}

export const CableLink: React.FC<CableLinkProps> = ({ cable, devices, onContextMenu }) => {
  const srcDev = devices.find((d) => d.id === cable.sourceDeviceId);
  const dstDev = devices.find((d) => d.id === cable.targetDeviceId);

  if (!srcDev || !dstDev) return null;

  // Ports index calculation for coordinate offset
  const srcPortIndex = srcDev.ports.findIndex((p) => p.id === cable.sourcePortId);
  const dstPortIndex = dstDev.ports.findIndex((p) => p.id === cable.targetPortId);

  const srcPortCount = srcDev.ports.length;
  const dstPortCount = dstDev.ports.length;

  // Offset along device width (device width is ~120px, height ~70px)
  const srcX = srcDev.x + 60 + ((srcPortIndex + 0.5) / Math.max(srcPortCount, 1) - 0.5) * 80;
  const srcY = srcDev.y + 35;

  const dstX = dstDev.x + 60 + ((dstPortIndex + 0.5) / Math.max(dstPortCount, 1) - 0.5) * 80;
  const dstY = dstDev.y + 35;

  const spec = CABLE_SPECS[cable.type] || CABLE_SPECS.straight;
  const strokeColor = cable.isUp ? spec.color : '#64748b';

  return (
    <g className="cursor-pointer group" onContextMenu={(e) => onContextMenu(e, cable)}>
      {/* Invisible wider hit-area line for easy right clicking */}
      <line
        x1={srcX}
        y1={srcY}
        x2={dstX}
        y2={dstY}
        stroke="transparent"
        strokeWidth={16}
      />

      {/* Actual visual cable */}
      <line
        x1={srcX}
        y1={srcY}
        x2={dstX}
        y2={dstY}
        stroke={strokeColor}
        strokeWidth={cable.isUp ? 2.5 : 1.5}
        strokeDasharray={spec.dashArray}
        strokeOpacity={cable.isUp ? 0.9 : 0.4}
        className="transition-all duration-300 group-hover:stroke-width-[4px]"
      />

      {/* Port connection LED status dots */}
      <circle
        cx={srcX}
        cy={srcY}
        r={3.5}
        fill={cable.isUp ? '#10b981' : '#ef4444'}
        className={cable.isUp ? 'animate-pulse' : ''}
      />
      <circle
        cx={dstX}
        cy={dstY}
        r={3.5}
        fill={cable.isUp ? '#10b981' : '#ef4444'}
        className={cable.isUp ? 'animate-pulse' : ''}
      />

      {/* Midpoint Info Badge */}
      <g transform={`translate(${(srcX + dstX) / 2}, ${(srcY + dstY) / 2})`}>
        <rect
          x={-28}
          y={-10}
          width={56}
          height={20}
          rx={5}
          fill="#0f172a"
          stroke={cable.isUp ? strokeColor : '#475569'}
          strokeWidth={1}
          opacity={0.9}
        />
        <text
          x={0}
          y={3}
          fill="#cbd5e1"
          fontSize={9}
          fontFamily="monospace"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {cable.lengthMeters}m
        </text>
      </g>
    </g>
  );
};

'use client';

import type { ItemType } from '@/types';

const CUBE_SIZE = 20;
const FONT_SIZE = 8;

function getLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

interface CubeBlockProps {
  color: string;
  weight: number;
  dimmed?: boolean;
  className?: string;
  itemType?: ItemType;
  hideLabel?: boolean;
}

export default function CubeBlock({ color, weight, dimmed, className, itemType = 'cube', hideLabel }: CubeBlockProps) {
  const isLight = getLuminance(color) > 0.55;
  const textColor = isLight ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.95)';
  const shadow = isLight ? 'none' : '0 1px 2px rgba(0,0,0,0.5)';
  const label = hideLabel ? '' : weight;

  if (itemType === 'portion') {
    // Rectangle: 40×20
    return (
      <div
        className={`rounded-[3px] flex items-center justify-center font-extrabold leading-none select-none ${dimmed ? 'opacity-20' : ''} ${className ?? ''}`}
        style={{
          width: CUBE_SIZE * 2,
          height: CUBE_SIZE,
          fontSize: FONT_SIZE,
          backgroundColor: color,
          color: textColor,
          textShadow: shadow,
        }}
      >
        {label}
      </div>
    );
  }

  if (itemType === 'raw') {
    // Circle: 20×20
    return (
      <div
        className={`rounded-full flex items-center justify-center font-extrabold leading-none select-none ${dimmed ? 'opacity-20' : ''} ${className ?? ''}`}
        style={{
          width: CUBE_SIZE,
          height: CUBE_SIZE,
          fontSize: FONT_SIZE,
          backgroundColor: color,
          color: textColor,
          textShadow: shadow,
        }}
      >
        {label}
      </div>
    );
  }

  if (itemType === 'blw') {
    // Triangle: SVG
    return (
      <svg
        width={CUBE_SIZE}
        height={CUBE_SIZE}
        viewBox="0 0 20 20"
        className={`select-none ${dimmed ? 'opacity-20' : ''} ${className ?? ''}`}
      >
        <polygon points="10,1 19,19 1,19" fill={color} />
        <text
          x="10"
          y="15"
          textAnchor="middle"
          fontSize={FONT_SIZE}
          fontWeight="800"
          fill={textColor}
          style={{ textShadow: shadow }}
        >
          {label}
        </text>
      </svg>
    );
  }

  // Default: cube (square)
  return (
    <div
      className={`rounded-[3px] flex items-center justify-center font-extrabold leading-none select-none ${dimmed ? 'opacity-20' : ''} ${className ?? ''}`}
      style={{
        width: CUBE_SIZE,
        height: CUBE_SIZE,
        fontSize: FONT_SIZE,
        backgroundColor: color,
        color: textColor,
        textShadow: shadow,
      }}
    >
      {label}
    </div>
  );
}

export { getLuminance };

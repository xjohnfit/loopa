import React from 'react';
import Svg, { Line, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'chevron-left'
  | 'chevron-right'
  | 'plus'
  | 'close'
  | 'trash'
  | 'list'
  | 'calendar-check'
  | 'check';

interface Props {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}

export default function Icon({ name, size = 24, color, strokeWidth = 2 }: Props) {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'chevron-left' && <Path d="M15 18L9 12L15 6" {...common} />}
      {name === 'chevron-right' && <Path d="M9 18L15 12L9 6" {...common} />}
      {name === 'check' && <Path d="M5 13L9.5 17.5L19 7" {...common} />}

      {name === 'plus' && (
        <>
          <Line x1={12} y1={5} x2={12} y2={19} {...common} />
          <Line x1={5} y1={12} x2={19} y2={12} {...common} />
        </>
      )}

      {name === 'close' && (
        <>
          <Line x1={6} y1={6} x2={18} y2={18} {...common} />
          <Line x1={18} y1={6} x2={6} y2={18} {...common} />
        </>
      )}

      {name === 'list' && (
        <>
          <Line x1={5} y1={7} x2={19} y2={7} {...common} />
          <Line x1={5} y1={12} x2={19} y2={12} {...common} />
          <Line x1={5} y1={17} x2={13} y2={17} {...common} />
        </>
      )}

      {name === 'trash' && (
        <>
          <Line x1={4} y1={7} x2={20} y2={7} {...common} />
          <Path d="M9 7V5H15V7" {...common} />
          <Path d="M6 7L7.5 20H16.5L18 7" {...common} />
          <Line x1={10} y1={11} x2={10} y2={16} {...common} />
          <Line x1={14} y1={11} x2={14} y2={16} {...common} />
        </>
      )}

      {name === 'calendar-check' && (
        <>
          <Rect x={4} y={5} width={16} height={16} rx={3} {...common} />
          <Line x1={4} y1={10} x2={20} y2={10} {...common} />
          <Line x1={8} y1={3} x2={8} y2={7} {...common} />
          <Line x1={16} y1={3} x2={16} y2={7} {...common} />
          <Path d="M9 14.5L11 16.5L15.5 12" {...common} />
        </>
      )}
    </Svg>
  );
}

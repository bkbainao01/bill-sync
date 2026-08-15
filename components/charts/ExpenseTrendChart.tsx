import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import type { MonthExpense } from '@/core/calculations/trend';
import { niceCeil } from '@/core/calculations/trend';
import { THAI_MONTHS_SHORT } from '@/core/calculations/format';
import { useThemeStore } from '@/store/theme';

interface Props {
  data: MonthExpense[];
  height?: number;
}

const LIGHT_COLORS = {
  line: '#0891b2',
  grid: 'rgba(100, 116, 139, 0.25)',
  label: '#64748b',
  value: '#334155',
  area: 'rgba(8, 145, 178, 0.15)',
};

const DARK_COLORS = {
  line: '#22d3ee',
  grid: 'rgba(226, 232, 240, 0.18)',
  label: '#94a3b8',
  value: '#e2e8f0',
  area: 'rgba(34, 211, 238, 0.18)',
};

const PAD = { top: 20, right: 10, bottom: 26, left: 10 };

function monthShort(month: string): string {
  const m = Number(month.slice(5, 7));
  if (m < 1 || m > 12) return month;
  return THAI_MONTHS_SHORT[m - 1];
}

function compact(baht: number): string {
  return new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 }).format(Math.round(baht));
}

/** กราฟเส้น/พื้นที่แสดงยอดรายจ่ายรายเดือน */
export function ExpenseTrendChart({ data, height = 190 }: Props) {
  const [width, setWidth] = useState(0);
  const colorMode = useThemeStore((s) => s.colorMode);
  const COLORS = colorMode === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  if (data.length < 2) {
    return <View style={{ height }} />;
  }

  const maxRaw = Math.max(...data.map((d) => d.expense), 1);
  const maxValue = niceCeil(maxRaw / 100); // บาท
  const maxSatang = maxValue * 100;

  const innerW = Math.max(width - PAD.left - PAD.right, 10);
  const innerH = height - PAD.top - PAD.bottom;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const x = (i: number) => PAD.left + i * stepX;
  const y = (expense: number) => PAD.top + innerH - (expense / maxSatang) * innerH;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.expense).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${x(data.length - 1).toFixed(1)} ${(PAD.top + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(PAD.top + innerH).toFixed(1)} Z`;

  const gridLines = [0.25, 0.5, 0.75, 1];
  const baseY = PAD.top + innerH;

  return (
    <View
      style={{ height }}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && w !== width) setWidth(w);
      }}
    >
      {width > 0 ? (
        <Svg width={width} height={height}>
          {gridLines.map((f) => {
            const gy = baseY - innerH * f;
            return (
              <G key={f}>
                <Line x1={PAD.left} y1={gy} x2={width - PAD.right} y2={gy} stroke={COLORS.grid} strokeWidth={1} />
                <SvgText x={width - PAD.right} y={gy - 4} fontSize={9} fill={COLORS.label} textAnchor="end">
                  {compact(maxValue * f)}
                </SvgText>
              </G>
            );
          })}

          <Path d={areaPath} fill={COLORS.area} />
          <Path d={linePath} stroke={COLORS.line} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />

          {data.map((d, i) => (
            <Circle key={d.month} cx={x(i)} cy={y(d.expense)} r={3.5} fill={COLORS.line} stroke="#ffffff" strokeWidth={1.5} />
          ))}

          {data.map((d, i) => (
            <SvgText
              key={`v-${d.month}`}
              x={x(i)}
              y={y(d.expense) - 8}
              fontSize={9}
              fill={COLORS.value}
              textAnchor="middle"
              fontWeight="600"
            >
              {d.expense > 0 ? compact(d.expense / 100) : ''}
            </SvgText>
          ))}

          {data.map((d, i) => (
            <SvgText
              key={`m-${d.month}`}
              x={x(i)}
              y={height - 8}
              fontSize={10}
              fill={COLORS.label}
              textAnchor="middle"
            >
              {monthShort(d.month)}
            </SvgText>
          ))}
        </Svg>
      ) : null}
    </View>
  );
}

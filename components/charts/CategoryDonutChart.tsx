import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text, VStack, HStack } from '@gluestack-ui/themed';
import { formatBaht } from '@/core/calculations/format';
import { FONT_MONO } from '@/theme/tokens';

export interface DonutSlice {
  id: string;
  label: string;
  color: string;
  /** ยอดในหน่วยสตางค์ */
  value: number;
}

interface Props {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
}

function polar(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number): string {
  const startPt = polar(cx, cy, r, start);
  const endPt = polar(cx, cy, r, end);
  const largeArc = end - start > 180 ? 1 : 0;
  return `M ${startPt.x.toFixed(2)} ${startPt.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${endPt.x.toFixed(2)} ${endPt.y.toFixed(2)}`;
}

/** โดนัทแสดงสัดส่วนรายจ่ายแยกตามหมวด + ตำนาน */
export function CategoryDonutChart({ data, size = 170, thickness = 26 }: Props) {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  if (total === 0) {
    return (
      <Text size="sm" color="$textLight400" textAlign="center" style={{ paddingVertical: 16 }}>
        ยังไม่มีรายจ่ายในเดือนนี้
      </Text>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;

  const sorted = [...data].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, 5);
  const restTotal = sorted.slice(5).reduce((acc, d) => acc + d.value, 0);

  let angle = 0;
  const slices: Array<{ color: string; path: string }> = [];
  const topTotal = top.reduce((acc, d) => acc + d.value, 0);

  for (const d of top) {
    const sweep = (d.value / total) * 360;
    slices.push({ color: d.color, path: arcPath(cx, cy, r, angle, angle + sweep) });
    angle += sweep;
  }
  if (restTotal > 0) {
    const sweep = (restTotal / total) * 360;
    slices.push({ color: '#94a3b8', path: arcPath(cx, cy, r, angle, angle + sweep) });
  }

  const legendRows = [
    ...top.map((d) => ({ id: d.id, label: d.label, color: d.color, value: d.value, pct: (d.value / total) * 100 })),
  ];
  if (restTotal > 0) {
    legendRows.push({ id: '__rest__', label: 'อื่นๆ', color: '#94a3b8', value: restTotal, pct: (restTotal / total) * 100 });
  }

  return (
    <VStack space="md">
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          {slices.map((s, i) => (
            <Path
              key={i}
              d={s.path}
              stroke={s.color}
              strokeWidth={thickness}
              fill="none"
              strokeLinecap="butt"
            />
          ))}
        </Svg>
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text
            fontWeight="$bold"
            size="lg"
            style={{ fontFamily: FONT_MONO, fontVariant: ['tabular-nums'] }}
          >
            {formatBaht(total)}
          </Text>
          <Text size="xs" color="$textLight400">
            รายจ่ายรวม
          </Text>
        </View>
      </View>

      <VStack space="sm">
        {legendRows.map((row) => (
          <HStack key={row.id} space="sm" alignItems="center" justifyContent="space-between">
            <HStack space="sm" alignItems="center" flex={1}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: row.color }} />
              <Text size="sm" numberOfLines={1} flex={1}>
                {row.label}
              </Text>
            </HStack>
            <Text size="sm" color="$textLight400">
              {row.pct.toFixed(0)}%
            </Text>
            <Text size="sm" fontWeight="$semibold" style={{ minWidth: 90, textAlign: 'right' }}>
              {formatBaht(row.value)}
            </Text>
          </HStack>
        ))}
      </VStack>
    </VStack>
  );
}

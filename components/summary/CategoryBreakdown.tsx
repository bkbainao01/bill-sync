import { View } from 'react-native';
import { Divider, HStack, Text, VStack } from '@gluestack-ui/themed';
import type { Category } from '@/core/entities/category';
import { formatBaht } from '@/core/calculations/format';

interface Props {
  /** categoryId → ยอดรายจ่าย (สตางค์) */
  byCategory: Record<string, number>;
  categories: Category[];
}

const TOP_N = 5;

export function CategoryBreakdown({ byCategory, categories }: Props) {
  const total = Object.values(byCategory).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return (
      <Text size="sm" color="$textLight400" textAlign="center" style={{ paddingVertical: 16 }}>
        ยังไม่มีรายจ่ายในเดือนนี้
      </Text>
    );
  }

  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? 'ไม่ระบุหมวด';
  const catColor = (id: string) => categories.find((c) => c.id === id)?.color ?? '#6b7280';

  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, TOP_N);
  const rest = sorted.slice(TOP_N);
  const restTotal = rest.reduce((acc, [, v]) => acc + v, 0);

  const rows: Array<{ id: string; name: string; color: string; amount: number }> = [
    ...top.map(([id, v]) => ({ id, name: catName(id), color: catColor(id), amount: v })),
  ];
  if (restTotal > 0) {
    rows.push({ id: '__rest__', name: 'อื่นๆ', color: '#94a3b8', amount: restTotal });
  }

  return (
    <VStack space="sm">
      {rows.map((row, i) => {
        const pct = (row.amount / total) * 100;
        return (
          <View key={row.id}>
            {i > 0 ? <Divider style={{ marginVertical: 8 }} /> : null}
            <HStack space="sm" alignItems="center" justifyContent="space-between">
              <HStack space="sm" alignItems="center" flex={1}>
                <View
                  style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: row.color }}
                />
                <Text size="sm" numberOfLines={1} flex={1}>
                  {row.name}
                </Text>
              </HStack>
              <Text size="sm" fontWeight="$semibold">
                {formatBaht(row.amount)}
              </Text>
            </HStack>
            <View
              style={{
                marginTop: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#e2e8f0',
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  width: `${Math.max(pct, 2)}%`,
                  height: '100%',
                  borderRadius: 3,
                  backgroundColor: row.color,
                }}
              />
            </View>
          </View>
        );
      })}
    </VStack>
  );
}

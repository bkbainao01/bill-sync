import { Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Text, VStack } from '@gluestack-ui/themed';
import { formatBaht, monthLabel, shiftMonth } from '@/core/calculations/format';
import { useUiStore } from '@/store/ui';
import { BRAND, FONT_MONO, INK, SEAM, SLATE } from '@/theme/tokens';

interface Props {
  /** ยอดรายจ่ายของเดือนที่เลือก (สตางค์) — ถ้ามี จะแสดงเป็น "รวมทั้งสิ้น" แบบก้นใบเสร็จ */
  totalSatang?: number | null;
}

/**
 * หัวแถบแบบใบเสร็จ: เดือนซ้าย + เส้นประคั่น + ยอดรายจ่ายเดือน (mono) + เส้นหมึกหนาใต้แถบ
 * — signature ของธีม "thermal slip"
 */
export function MonthPicker({ totalSatang }: Props) {
  const selectedMonth = useUiStore((s) => s.selectedMonth);
  const setSelectedMonth = useUiStore((s) => s.setSelectedMonth);

  const totalText = totalSatang != null ? formatBaht(totalSatang).replace(/\s*บาท$/, '') : null;

  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}
          hitSlop={8}
          style={{ padding: 8 }}
          accessibilityLabel="เดือนก่อนหน้า"
        >
          <Ionicons name="chevron-back" size={22} color={BRAND} />
        </Pressable>
        <Text fontWeight="$bold" fontSize="$lg" numberOfLines={1} style={{ flexShrink: 1 }}>
          {monthLabel(selectedMonth)}
        </Text>
        {totalText != null ? (
          <>
            <View
              style={{
                flex: 1,
                borderBottomWidth: 1,
                borderStyle: 'dotted',
                borderColor: SEAM,
                marginHorizontal: 10,
                marginBottom: 3,
              }}
            />
            <Animated.View
              key={selectedMonth}
              entering={FadeIn.duration(180)}
              exiting={FadeOut.duration(120)}
            >
              <VStack alignItems="flex-end">
                <Text size="xs" color="$textLight400">
                  รวมทั้งสิ้น
                </Text>
                <Text
                  fontWeight="$bold"
                  size="xl"
                  color="$textLight900"
                  selectable
                  style={{ fontFamily: FONT_MONO, fontVariant: ['tabular-nums'] }}
                >
                  {totalText}
                </Text>
              </VStack>
            </Animated.View>
          </>
        ) : null}
        <Pressable
          onPress={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}
          hitSlop={8}
          style={{ padding: 8 }}
          accessibilityLabel="เดือนถัดไป"
        >
          <Ionicons name="chevron-forward" size={22} color={BRAND} />
        </Pressable>
      </View>
      <View style={{ borderBottomWidth: 2, borderColor: INK, marginTop: 2 }} />
    </View>
  );
}

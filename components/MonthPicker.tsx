import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@gluestack-ui/themed';
import { monthLabel, shiftMonth } from '@/core/calculations/format';
import { useUiStore } from '@/store/ui';

export function MonthPicker() {
  const selectedMonth = useUiStore((s) => s.selectedMonth);
  const setSelectedMonth = useUiStore((s) => s.setSelectedMonth);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}
    >
      <Pressable
        onPress={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}
        hitSlop={8}
        style={{ padding: 8 }}
        accessibilityLabel="เดือนก่อนหน้า"
      >
        <Ionicons name="chevron-back" size={22} color="#0891b2" />
      </Pressable>
      <Text fontWeight="$bold" fontSize="$lg">
        {monthLabel(selectedMonth)}
      </Text>
      <Pressable
        onPress={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}
        hitSlop={8}
        style={{ padding: 8 }}
        accessibilityLabel="เดือนถัดไป"
      >
        <Ionicons name="chevron-forward" size={22} color="#0891b2" />
      </Pressable>
    </View>
  );
}

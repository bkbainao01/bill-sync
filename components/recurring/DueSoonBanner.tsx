import { useMemo } from 'react';
import { View } from 'react-native';
import { Button, ButtonText, HStack, Text, VStack } from '@gluestack-ui/themed';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTransactions } from '@/hooks/useTransactions';
import { useRecurringBills } from '@/hooks/useRecurringBills';
import { dueSoonBills } from '@/core/recurring/reminders';
import { todayKey, formatDateThai } from '@/core/calculations/format';
import { useReminderSettings } from '@/store/reminderSettings';

function daysLabel(daysUntil: number): string {
  if (daysUntil < 0) return `เลยกำหนด ${-daysUntil} วัน`;
  if (daysUntil === 0) return 'ครบกำหนดวันนี้';
  if (daysUntil === 1) return 'ครบกำหนดพรุ่งนี้';
  return `อีก ${daysUntil} วัน`;
}

/** แบนเนอร์ในแอป: บิลประจำที่ใกล้ครบกำหนด (แสดงเสมอ ไม่ขึ้นกับสวิตช์แจ้งเตือน) */
export function DueSoonBanner() {
  const router = useRouter();
  const { data: transactions = [] } = useTransactions();
  const { data: recurringBills = [] } = useRecurringBills();
  const leadDays = useReminderSettings((s) => s.leadDays);

  const due = useMemo(
    () =>
      dueSoonBills({
        recurringBills,
        transactions,
        todayStr: todayKey(),
        leadDays,
      }).slice(0, 3),
    [recurringBills, transactions, leadDays],
  );

  if (due.length === 0) return null;

  return (
    <View style={{ backgroundColor: '#fef3c7', borderRadius: 12, padding: 12, marginBottom: 12 }}>
      <VStack space="xs">
        <HStack space="sm" alignItems="center">
          <Ionicons name="notifications-outline" size={18} color="#92400e" />
          <Text size="sm" fontWeight="$bold" style={{ color: '#78350f' }}>
            บิลใกล้ครบกำหนด
          </Text>
        </HStack>
        {due.map((d) => (
          <HStack key={d.recurringBill.id} space="sm" alignItems="center" justifyContent="space-between">
            <Text size="sm" style={{ color: '#78350f' }} flex={1} numberOfLines={1}>
              {d.recurringBill.merchant} · {formatDateThai(d.expectedDate)}
            </Text>
            <Text size="xs" fontWeight="$semibold" style={{ color: '#92400e' }}>
              {daysLabel(d.daysUntil)}
            </Text>
          </HStack>
        ))}
        <Button
          size="sm"
          variant="outline"
          borderColor="#d97706"
          style={{ alignSelf: 'flex-start', marginTop: 4 }}
          onPress={() => router.push('/recurring')}
        >
          <ButtonText style={{ color: '#b45309' }}>ดูบิลประจำ</ButtonText>
        </Button>
      </VStack>
    </View>
  );
}

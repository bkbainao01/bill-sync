import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, ButtonText, Card, HStack, Switch, Text, VStack } from '@gluestack-ui/themed';
import type { Category } from '@/core/entities/category';
import type { RecurringBill } from '@/core/entities/recurringBill';
import type { RecurringStatusInfo } from '@/core/recurring/period';
import { cadenceLabel } from '@/core/recurring/period';
import { formatBaht, formatDateThai } from '@/core/calculations/format';

interface Props {
  rb: RecurringBill;
  category: Category | undefined;
  status: RecurringStatusInfo;
  isPending?: boolean;
  onCreateTransaction: (rb: RecurringBill) => void;
  onToggleEnabled: (rb: RecurringBill) => void;
  onDelete: (rb: RecurringBill) => void;
}

const STATUS_META: Record<
  RecurringStatusInfo['status'],
  { label: (info: RecurringStatusInfo) => string; color: string }
> = {
  due: {
    label: (i) => `ครบกำหนด ${i.expectedDate ? formatDateThai(i.expectedDate) : ''}`,
    color: '#b91c1c',
  },
  upcoming: {
    label: (i) => `ถึงกำหนด ${i.expectedDate ? formatDateThai(i.expectedDate) : ''}`,
    color: '#64748b',
  },
  paid: {
    label: (i) => `จ่ายแล้ว ${i.paidDate ? formatDateThai(i.paidDate) : ''}`,
    color: '#15803d',
  },
  disabled: { label: () => 'ปิดอยู่', color: '#94a3b8' },
};

export function RecurringBillRow({
  rb,
  category,
  status,
  isPending,
  onCreateTransaction,
  onToggleEnabled,
  onDelete,
}: Props) {
  const meta = STATUS_META[status.status];
  const color = category?.color ?? '#6b7280';

  return (
    <Card style={{ borderRadius: 12 }}>
      <VStack space="sm">
        <HStack space="sm" alignItems="center">
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />
          <VStack space="xs" flex={1}>
            <Text fontWeight="$semibold" numberOfLines={1}>
              {rb.merchant}
            </Text>
            <Text size="xs" color="$textLight400">
              {cadenceLabel(rb)} · {category?.name ?? 'ไม่ระบุหมวด'}
            </Text>
          </VStack>
          <Text fontWeight="$bold">{formatBaht(rb.amount)}</Text>
        </HStack>

        <HStack space="sm" alignItems="center" justifyContent="space-between">
          <Text size="xs" style={{ color: meta.color, fontWeight: '700' }}>
            {meta.label(status)}
          </Text>
          <HStack space="sm" alignItems="center">
            {status.status === 'due' ? (
              <Button
                size="sm"
                bgColor="#0891b2"
                isDisabled={isPending}
                onPress={() => onCreateTransaction(rb)}
              >
                <ButtonText style={{ color: '#ffffff' }}>สร้างรายการ</ButtonText>
              </Button>
            ) : null}
            <Switch
              size="sm"
              value={rb.enabled}
              onValueChange={() => onToggleEnabled(rb)}
              accessibilityLabel="เปิด/ปิดบิลประจำ"
            />
            <Pressable
              onPress={() => onDelete(rb)}
              hitSlop={8}
              style={{ padding: 4 }}
              accessibilityLabel="ลบบิลประจำ"
            >
              <Ionicons name="trash-outline" size={18} color="#94a3b8" />
            </Pressable>
          </HStack>
        </HStack>
      </VStack>
    </Card>
  );
}

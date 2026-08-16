import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HStack, Text, VStack } from '@gluestack-ui/themed';
import type { Category } from '@/core/entities/category';
import type { Transaction } from '@/core/entities/transaction';
import { formatBaht, formatDateThai } from '@/core/calculations/format';
import { FONT_MONO } from '@/theme/tokens';

interface Props {
  transaction: Transaction;
  category: Category | undefined;
  onDelete?: (id: string) => void;
}

export function TransactionRow({ transaction, category, onDelete }: Props) {
  const isIncome = transaction.type === 'income';
  const color = category?.color ?? '#6b7280';
  const title = transaction.merchant ?? category?.name ?? 'ไม่ระบุหมวด';

  return (
    <HStack
      space="md"
      alignItems="center"
      style={{ paddingVertical: 10, paddingHorizontal: 4 }}
    >
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />
      <VStack space="xs" flex={1}>
        <Text fontWeight="$semibold" numberOfLines={1}>
          {title}
        </Text>
        <Text size="sm" color="$textLight400" selectable>
          {formatDateThai(transaction.date)}
          {transaction.note ? ` · ${transaction.note}` : ''}
        </Text>
      </VStack>
      <Text
        fontWeight="$bold"
        color={isIncome ? '$textSuccess700' : undefined}
        selectable
        style={{ fontFamily: FONT_MONO, fontVariant: ['tabular-nums'] }}
      >
        {isIncome ? '+' : '-'}
        {formatBaht(transaction.amount)}
      </Text>
      {onDelete ? (
        <Pressable
          onPress={() => onDelete(transaction.id)}
          hitSlop={8}
          style={{ padding: 6 }}
          accessibilityLabel="ลบรายการ"
        >
          <Ionicons name="trash-outline" size={18} color="#94a3b8" />
        </Pressable>
      ) : null}
    </HStack>
  );
}

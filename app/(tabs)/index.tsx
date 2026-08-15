import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Box, Button, ButtonText, Text } from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import { TransactionList } from '@/components/transaction/TransactionList';
import { MonthPicker } from '@/components/MonthPicker';
import { DueSoonBanner } from '@/components/recurring/DueSoonBanner';
import { useCategories } from '@/hooks/useCategories';
import { useDeleteTransaction, useTransactions } from '@/hooks/useTransactions';
import { monthKey } from '@/core/calculations/summary';
import { useUiStore } from '@/store/ui';
import { confirmAction } from '@/lib/confirm';

export default function TransactionsScreen() {
  const router = useRouter();
  const { data: transactions = [], isLoading } = useTransactions();
  const { data: categories = [] } = useCategories();
  const deleteTx = useDeleteTransaction();
  const selectedMonth = useUiStore((s) => s.selectedMonth);

  const categoriesById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const monthTransactions = useMemo(
    () => transactions.filter((t) => monthKey(t.date) === selectedMonth),
    [transactions, selectedMonth],
  );

  return (
    <Box flex={1} padding={16} bg="$backgroundLight50">
      <MonthPicker />
      <DueSoonBanner />
      <Button
        variant="outline"
        borderColor="#0891b2"
        onPress={() => router.push('/scan')}
        style={{ marginBottom: 12 }}
      >
        <Ionicons name="scan-outline" size={18} color="#0891b2" />
        <ButtonText color="#0891b2" style={{ marginLeft: 6 }}>
          สแกนบิลด้วย AI
        </ButtonText>
      </Button>
      <Text size="sm" color="$textLight400" style={{ marginBottom: 8 }}>
        {monthTransactions.length} รายการ ในเดือนนี้
      </Text>
      <TransactionList
        transactions={monthTransactions}
        categoriesById={categoriesById}
        isLoading={isLoading}
        onDelete={(id) => {
          if (confirmAction('ลบรายการนี้?')) deleteTx.mutate(id);
        }}
      />
      <Button
        style={{
          position: 'absolute',
          right: 16,
          bottom: 16,
          borderRadius: 999,
          paddingHorizontal: 20,
          backgroundColor: '#0891b2',
        }}
        onPress={() => router.push('/transaction/new')}
      >
        <Ionicons name="add" size={20} color="#ffffff" />
        <ButtonText style={{ color: '#ffffff', marginLeft: 4 }}>เพิ่มรายการ</ButtonText>
      </Button>
    </Box>
  );
}

import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button, ButtonText, Spinner, Text, VStack, Center } from '@gluestack-ui/themed';
import { Ionicons } from '@expo/vector-icons';
import type { RecurringBill } from '@/core/entities/recurringBill';
import type { RecurringStatusInfo } from '@/core/recurring/period';
import { recurringStatus } from '@/core/recurring/period';
import { createTransactionFromRecurring } from '@/core/recurring/fromRecurring';
import { todayKey } from '@/core/calculations/format';
import { RecurringBillRow } from '@/components/recurring/RecurringBillRow';
import { RecurringForm } from '@/components/recurring/RecurringForm';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions, useCreateTransaction } from '@/hooks/useTransactions';
import {
  useDeleteRecurringBill,
  useRecurringBills,
  useUpdateRecurringBill,
} from '@/hooks/useRecurringBills';
import { confirmAction } from '@/lib/confirm';

type Status = RecurringStatusInfo['status'];
const ORDER: Status[] = ['due', 'upcoming', 'paid', 'disabled'];

export default function RecurringScreen() {
  const { data: recurringBills = [], isLoading } = useRecurringBills();
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const createTx = useCreateTransaction();
  const updateRb = useUpdateRecurringBill();
  const deleteRb = useDeleteRecurringBill();

  const [showForm, setShowForm] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const categoriesById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const rows = useMemo(() => {
    const today = todayKey();
    const withStatus = recurringBills.map((rb) => ({
      rb,
      status: recurringStatus(rb, transactions, today),
    }));
    return withStatus.sort((a, b) => {
      const rank = (s: Status) => ORDER.indexOf(s);
      const byRank = rank(a.status.status) - rank(b.status.status);
      if (byRank !== 0) return byRank;
      if (a.status.status === 'paid' && b.status.status === 'paid') {
        return (b.status.paidDate ?? '').localeCompare(a.status.paidDate ?? '');
      }
      return (a.status.expectedDate ?? '').localeCompare(b.status.expectedDate ?? '');
    });
  }, [recurringBills, transactions]);

  const handleCreateTransaction = async (rb: RecurringBill) => {
    setPendingId(rb.id);
    try {
      const tx = createTransactionFromRecurring(rb, todayKey());
      await createTx.mutateAsync(tx);
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading) {
    return (
      <Center flex={1}>
        <Spinner color="#0891b2" />
      </Center>
    );
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <VStack space="md">
        <Button bgColor="#0891b2" onPress={() => setShowForm((v) => !v)}>
          <Ionicons name={showForm ? 'close' : 'add'} size={18} color="#ffffff" />
          <ButtonText style={{ color: '#ffffff', marginLeft: 6 }}>
            {showForm ? 'ปิดฟอร์ม' : 'เพิ่มบิลประจำ'}
          </ButtonText>
        </Button>

        {showForm ? <RecurringForm onDone={() => setShowForm(false)} /> : null}

        {rows.length === 0 ? (
          <View style={{ paddingVertical: 40 }}>
            <VStack space="sm" alignItems="center">
              <Ionicons name="repeat-outline" size={48} color="#94a3b8" />
              <Text fontWeight="$bold" size="lg">
                ยังไม่มีบิลประจำ
              </Text>
              <Text size="sm" color="$textLight400" textAlign="center">
                เพิ่มบิลรายเดือน เช่น ค่าไฟ ค่าโทรศัพท์ แล้วกด "สร้างรายการ" เมื่อถึงกำหนด
              </Text>
            </VStack>
          </View>
        ) : (
          rows.map(({ rb, status }) => (
            <RecurringBillRow
              key={rb.id}
              rb={rb}
              category={categoriesById.get(rb.categoryId)}
              status={status}
              isPending={pendingId === rb.id}
              onCreateTransaction={(b) => void handleCreateTransaction(b)}
              onToggleEnabled={(b) => updateRb.mutate({ ...b, enabled: !b.enabled })}
              onDelete={(b) => {
                if (confirmAction(`ลบบิลประจำ "${b.merchant}"?`)) deleteRb.mutate(b.id);
              }}
            />
          ))
        )}
      </VStack>
    </ScrollView>
  );
}

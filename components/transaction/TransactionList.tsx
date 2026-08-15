import { FlatList, StyleSheet } from 'react-native';
import { Divider, Spinner, Center } from '@gluestack-ui/themed';
import type { Category } from '@/core/entities/category';
import type { Transaction } from '@/core/entities/transaction';
import { TransactionRow } from './TransactionRow';
import { EmptyState } from '../EmptyState';

interface Props {
  transactions: Transaction[];
  categoriesById: Map<string, Category>;
  isLoading?: boolean;
  onDelete?: (id: string) => void;
}

export function TransactionList({ transactions, categoriesById, isLoading, onDelete }: Props) {
  if (isLoading) {
    return (
      <Center flex={1}>
        <Spinner color="#0891b2" />
      </Center>
    );
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon="receipt-outline"
        title="ยังไม่มีรายการ"
        description="กดปุ่ม + เพิ่มรายการ เพื่อบันทึกรายรับ/รายจ่ายแรกของคุณ"
      />
    );
  }

  return (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.id}
      ItemSeparatorComponent={() => <Divider />}
      renderItem={({ item }) => (
        <TransactionRow
          transaction={item}
          category={categoriesById.get(item.categoryId ?? '')}
          onDelete={onDelete}
        />
      )}
      style={styles.list}
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { paddingBottom: 80 },
});

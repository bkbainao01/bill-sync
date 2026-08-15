import { useMemo } from 'react';
import { Box, Card, Text, VStack } from '@gluestack-ui/themed';
import { MonthPicker } from '@/components/MonthPicker';
import { DueSoonBanner } from '@/components/recurring/DueSoonBanner';
import { SummaryCards } from '@/components/summary/SummaryCards';
import { ExpenseTrendChart } from '@/components/charts/ExpenseTrendChart';
import { CategoryDonutChart, type DonutSlice } from '@/components/charts/CategoryDonutChart';
import { useCategories } from '@/hooks/useCategories';
import { useTransactions } from '@/hooks/useTransactions';
import { expenseDeltaPercent, summarizeMonth } from '@/core/calculations/summary';
import { monthlyExpenseTrend } from '@/core/calculations/trend';
import { shiftMonth } from '@/core/calculations/format';
import { useUiStore } from '@/store/ui';

export default function DashboardScreen() {
  const { data: transactions = [] } = useTransactions();
  const { data: categories = [] } = useCategories();
  const selectedMonth = useUiStore((s) => s.selectedMonth);

  const summary = useMemo(
    () => summarizeMonth(transactions, selectedMonth),
    [transactions, selectedMonth],
  );
  const prevSummary = useMemo(
    () => summarizeMonth(transactions, shiftMonth(selectedMonth, -1)),
    [transactions, selectedMonth],
  );
  const expenseDelta = expenseDeltaPercent(summary.expense, prevSummary.expense);

  const trend = useMemo(
    () => monthlyExpenseTrend(transactions, selectedMonth, 6),
    [transactions, selectedMonth],
  );

  const donutData: DonutSlice[] = useMemo(() => {
    const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? 'ไม่ระบุหมวด';
    const catColor = (id: string) => categories.find((c) => c.id === id)?.color ?? '#6b7280';
    return Object.entries(summary.byCategory).map(([id, value]) => ({
      id,
      label: catName(id),
      color: catColor(id),
      value,
    }));
  }, [summary.byCategory, categories]);

  return (
    <Box flex={1} padding={16} bg="$backgroundLight50">
      <MonthPicker />
      <DueSoonBanner />
      <VStack space="md">
        <SummaryCards summary={summary} expenseDelta={expenseDelta} />

        <Card style={{ borderRadius: 12 }}>
          <VStack space="sm">
            <Text fontWeight="$bold" size="lg">
              แนวโน้มรายจ่าย 6 เดือน
            </Text>
            <ExpenseTrendChart data={trend} />
          </VStack>
        </Card>

        <Card style={{ borderRadius: 12 }}>
          <VStack space="sm">
            <Text fontWeight="$bold" size="lg">
              รายจ่ายแยกตามหมวด
            </Text>
            <CategoryDonutChart data={donutData} />
          </VStack>
        </Card>
      </VStack>
    </Box>
  );
}

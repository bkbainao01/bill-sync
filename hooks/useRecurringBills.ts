import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RecurringBill } from '@/core/entities/recurringBill';
import { repositories } from '@/store/di';

export const recurringBillsKey = ['recurringBills'] as const;

export function useRecurringBills() {
  return useQuery({
    queryKey: recurringBillsKey,
    queryFn: () => repositories.recurringBills.list(),
  });
}

export function useCreateRecurringBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rb: RecurringBill) => repositories.recurringBills.create(rb),
    onSuccess: () => qc.invalidateQueries({ queryKey: recurringBillsKey }),
  });
}

export function useUpdateRecurringBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rb: RecurringBill) => repositories.recurringBills.update(rb),
    onSuccess: () => qc.invalidateQueries({ queryKey: recurringBillsKey }),
  });
}

export function useDeleteRecurringBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repositories.recurringBills.softDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: recurringBillsKey }),
  });
}

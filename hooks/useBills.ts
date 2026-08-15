import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Bill } from '@/core/entities/bill';
import { repositories } from '@/store/di';

export const billsKey = ['bills'] as const;

export function useBills() {
  return useQuery({
    queryKey: billsKey,
    queryFn: () => repositories.bills.list(),
  });
}

export function useCreateBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bill: Bill) => repositories.bills.create(bill),
    onSuccess: () => qc.invalidateQueries({ queryKey: billsKey }),
  });
}

export function useUpdateBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bill: Bill) => repositories.bills.update(bill),
    onSuccess: () => qc.invalidateQueries({ queryKey: billsKey }),
  });
}

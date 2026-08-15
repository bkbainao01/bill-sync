import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Transaction } from '@/core/entities/transaction';
import { repositories } from '@/store/di';

export const transactionsKey = ['transactions'] as const;

export function useTransactions() {
  return useQuery({
    queryKey: transactionsKey,
    queryFn: () => repositories.transactions.list(),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tx: Transaction) => repositories.transactions.create(tx),
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionsKey }),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repositories.transactions.softDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: transactionsKey }),
  });
}

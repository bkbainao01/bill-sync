import { useQuery } from '@tanstack/react-query';
import { repositories } from '@/store/di';

export const categoriesKey = ['categories'] as const;

export function useCategories() {
  return useQuery({
    queryKey: categoriesKey,
    queryFn: () => repositories.categories.list(),
  });
}

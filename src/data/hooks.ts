import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CATEGORIES } from '../constants/categories';
import { addCategory, deleteRule, listCategories, listRules, listTxns, reviewTxn, saveRule } from './api';
import { useAuthStore } from '../store/auth';
import type { TxnStatus } from './types';

export const useTxns = (status: TxnStatus) =>
  useQuery({ queryKey: ['txns', status], queryFn: () => listTxns(status) });

export const useRules = () => useQuery({ queryKey: ['rules'], queryFn: listRules });

export function useReview() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async (input: Parameters<typeof reviewTxn>[0] & { remember?: { payeeKey: string } }) => {
      const { remember, ...review } = input;
      await reviewTxn(review);
      if (remember && userId && review.category) await saveRule(userId, remember.payeeKey, review.category);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['txns'] });
      qc.invalidateQueries({ queryKey: ['rules'] });
    },
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteRule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rules'] }),
  });
}

/** Built-in categories followed by the user's own (case-insensitive de-duplicated). */
export function useCategoryNames() {
  const { data } = useQuery({ queryKey: ['categories'], queryFn: listCategories });
  const names: string[] = [...CATEGORIES];
  for (const c of data ?? []) {
    if (!names.some((n) => n.toLowerCase() === c.name.trim().toLowerCase())) names.push(c.name.trim());
  }
  return names;
}

export function useAddCategory() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async (name: string) => {
      if (!userId) throw new Error('Not signed in');
      await addCategory(userId, name);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

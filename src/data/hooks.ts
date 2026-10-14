import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CATEGORIES } from '../constants/categories';
import { addCategory, applyPredefined, confirmBatch, deleteRule, listCategories, listRules, listTxns, reviewTxn, saveRule } from './api';
import { useAuthStore } from '../store/auth';
import { Alert } from 'react-native';
import type { TxnRow, TxnStatus } from './types';

export const useTxns = (status: TxnStatus) =>
  useQuery({ queryKey: ['txns', status], queryFn: () => listTxns(status) });

export const useRules = () => useQuery({ queryKey: ['rules'], queryFn: listRules });

type ReviewInput = Parameters<typeof reviewTxn>[0] & { remember?: { payeeKey: string } };

function reportFailure(title: string, error: unknown) {
  Alert.alert(title, error instanceof Error ? error.message : 'Something went wrong. Please try again.');
}

/**
 * Saves a review. The row leaves the Inbox immediately (optimistic) and comes back with an
 * alert if the save fails, so a tap always gives instant feedback.
 */
export function useReview() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  return useMutation({
    mutationFn: async (input: ReviewInput) => {
      const { remember, ...review } = input;
      await reviewTxn(review);
      if (remember && userId && review.category) await saveRule(userId, remember.payeeKey, review.category);
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ['txns'] });
      const previous = qc.getQueriesData<TxnRow[]>({ queryKey: ['txns'] });
      qc.setQueryData<TxnRow[]>(['txns', 'pending'], (old) => old?.filter((t) => t.id !== input.id));
      qc.setQueryData<TxnRow[]>(['txns', 'confirmed'], (old) =>
        old?.map((t) => (t.id === input.id ? { ...t, category: input.category, note: input.note } : t)),
      );
      return { previous };
    },
    onError: (error, _input, context) => {
      context?.previous.forEach(([key, data]) => qc.setQueryData(key, data));
      reportFailure('Could not save', error);
    },
    onSuccess: () => {
      // What was just confirmed now teaches the app: other pending rows of this payee get pre-filled.
      applyPredefined()
        .catch(() => undefined)
        .finally(() => qc.invalidateQueries({ queryKey: ['txns'] }));
    },
    onSettled: () => {
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

/** The notes the user has used most, for one-tap tagging ("Rapido ride"). */
export function useNoteSuggestions(limit = 6): string[] {
  const { data } = useTxns('confirmed');
  const counts = new Map<string, { text: string; n: number }>();
  for (const t of data ?? []) {
    const text = t.note?.trim();
    if (!text) continue;
    const entry = counts.get(text.toLowerCase()) ?? { text, n: 0 };
    entry.n += 1;
    counts.set(text.toLowerCase(), entry);
  }
  return [...counts.values()].sort((a, b) => b.n - a.n).slice(0, limit).map((e) => e.text);
}

export function useConfirmBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: confirmBatch,
    onMutate: async (updates) => {
      await qc.cancelQueries({ queryKey: ['txns'] });
      const previous = qc.getQueriesData<TxnRow[]>({ queryKey: ['txns'] });
      const done = new Set(updates.map((u) => u.id));
      qc.setQueryData<TxnRow[]>(['txns', 'pending'], (old) => old?.filter((t) => !done.has(t.id)));
      return { previous };
    },
    onError: (error, _updates, context) => {
      context?.previous.forEach(([key, data]) => qc.setQueryData(key, data));
      reportFailure('Could not confirm', error);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['txns'] }),
  });
}

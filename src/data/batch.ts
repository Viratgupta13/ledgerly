import type { TxnRow } from './types';

export type BatchItem = Pick<TxnRow, 'id' | 'merchant' | 'amount' | 'occurred_at' | 'category'>;
export type BatchGroup = { category: string; total: number; items: BatchItem[] };
export type Batch = {
  /** Payments that will be saved, grouped by their final category. */
  groups: BatchGroup[];
  /** Payments that still have no category; they stay pending until the user picks one. */
  missing: BatchItem[];
};

/**
 * Splits a batch of payments for the confirm-all preview. `overrides` holds categories the user
 * set or changed in the preview; `excluded` holds payments they removed from the batch.
 */
export function groupBatch(items: BatchItem[], overrides: Map<string, string>, excluded: Set<string>): Batch {
  const groups = new Map<string, BatchGroup>();
  const missing: BatchItem[] = [];
  for (const item of items) {
    if (excluded.has(item.id)) continue;
    const category = overrides.get(item.id) ?? item.category;
    if (!category) {
      missing.push(item);
      continue;
    }
    const g = groups.get(category) ?? { category, total: 0, items: [] };
    g.total += item.amount;
    g.items.push(item);
    groups.set(category, g);
  }
  return {
    groups: [...groups.values()]
      .map((g) => ({ ...g, total: Math.round(g.total * 100) / 100 }))
      .sort((a, b) => b.total - a.total),
    missing,
  };
}

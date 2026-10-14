import type { TxnRow } from './types';

export type BatchItem = Pick<TxnRow, 'id' | 'merchant' | 'amount' | 'occurred_at' | 'category'>;
export type BatchGroup = { category: string; total: number; items: BatchItem[] };

/**
 * Groups a batch of payments by category for the confirm-all preview. `overrides` holds
 * categories the user changed in the preview; `excluded` holds payments they removed.
 */
export function groupBatch(items: BatchItem[], overrides: Map<string, string>, excluded: Set<string>): BatchGroup[] {
  const groups = new Map<string, BatchGroup>();
  for (const item of items) {
    if (excluded.has(item.id)) continue;
    const category = overrides.get(item.id) ?? item.category;
    if (!category) continue;
    const g = groups.get(category) ?? { category, total: 0, items: [] };
    g.total += item.amount;
    g.items.push(item);
    groups.set(category, g);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, total: Math.round(g.total * 100) / 100 }))
    .sort((a, b) => b.total - a.total);
}

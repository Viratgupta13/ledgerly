import type { TxnRow } from './types';

export type BatchItem = Pick<TxnRow, 'id' | 'merchant' | 'payee_key' | 'amount' | 'occurred_at' | 'category'>;
export type PayeeGroup = { key: string; label: string; total: number; items: BatchItem[] };
export type CategoryGroup = { category: string; total: number; count: number; payees: PayeeGroup[] };

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Groups a batch for the confirm-all preview: category, then payee, then the individual payments.
 * `overrides` holds categories the user changed in the preview; `excluded` holds payments they
 * removed. Payments with no category are left out; they stay pending in the Inbox.
 */
export function groupBatch(items: BatchItem[], overrides: Map<string, string>, excluded: Set<string>): CategoryGroup[] {
  const cats = new Map<string, Map<string, PayeeGroup>>();
  for (const item of items) {
    if (excluded.has(item.id)) continue;
    const category = overrides.get(item.id) ?? item.category;
    if (!category) continue;

    const label = item.merchant ?? 'Unknown';
    const key = item.payee_key ?? label.toLowerCase();
    const payees = cats.get(category) ?? new Map<string, PayeeGroup>();
    const p = payees.get(key) ?? { key, label, total: 0, items: [] };
    p.total += item.amount;
    p.items.push(item);
    payees.set(key, p);
    cats.set(category, payees);
  }

  return [...cats.entries()]
    .map(([category, payees]) => {
      const list = [...payees.values()]
        .map((p) => ({
          ...p,
          total: round(p.total),
          items: p.items.sort((a, b) => b.occurred_at.localeCompare(a.occurred_at)),
        }))
        .sort((a, b) => b.total - a.total);
      return {
        category,
        total: round(list.reduce((n, p) => n + p.total, 0)),
        count: list.reduce((n, p) => n + p.items.length, 0),
        payees: list,
      };
    })
    .sort((a, b) => b.total - a.total);
}

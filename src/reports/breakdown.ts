import type { TxnRow } from '../data/types';

export type MerchantTotal = { key: string; label: string; total: number; count: number };
export type CategoryTotal = { name: string; total: number; count: number; merchants: MerchantTotal[] };
export type Breakdown = { total: number; categories: CategoryTotal[] };

export const UNCATEGORISED = 'Uncategorised';

type Input = Pick<TxnRow, 'amount' | 'type' | 'merchant' | 'payee_key' | 'category' | 'occurred_at'>;

/** Spending (debits) in one calendar month, grouped category -> merchant, biggest first. */
export function breakdownForMonth(txns: Input[], year: number, month: number): Breakdown {
  const cats = new Map<string, { total: number; count: number; merchants: Map<string, MerchantTotal> }>();
  let total = 0;

  for (const t of txns) {
    if (t.type !== 'debit') continue;
    const d = new Date(t.occurred_at);
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;

    const name = t.category?.trim() || UNCATEGORISED;
    const cat = cats.get(name) ?? { total: 0, count: 0, merchants: new Map() };
    cat.total += t.amount;
    cat.count += 1;

    const label = t.merchant ?? 'Unknown';
    const key = t.payee_key ?? label.toLowerCase();
    const m = cat.merchants.get(key) ?? { key, label, total: 0, count: 0 };
    m.total += t.amount;
    m.count += 1;
    cat.merchants.set(key, m);

    cats.set(name, cat);
    total += t.amount;
  }

  const round = (n: number) => Math.round(n * 100) / 100;
  const categories = [...cats.entries()]
    .map(([name, c]) => ({
      name,
      total: round(c.total),
      count: c.count,
      merchants: [...c.merchants.values()].map((m) => ({ ...m, total: round(m.total) })).sort((a, b) => b.total - a.total),
    }))
    .sort((a, b) => b.total - a.total);

  return { total: round(total), categories };
}

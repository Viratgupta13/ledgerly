import type { TxnRow } from '../data/types';

export type Item = { id: string; who: string; note: string | null; amount: number; date: string };
export type MerchantTotal = { key: string; label: string; total: number; count: number; items: Item[] };
export type CategoryTotal = { name: string; total: number; count: number; merchants: MerchantTotal[] };
export type Breakdown = { total: number; categories: CategoryTotal[] };
export type Period = { year: number; month: number } | 'all';

export const UNCATEGORISED = 'Uncategorised';

type Input = Pick<
  TxnRow,
  'id' | 'amount' | 'type' | 'merchant' | 'payee_key' | 'payee_kind' | 'category' | 'note' | 'occurred_at'
>;

/**
 * Spending (debits) grouped category -> group -> individual payments, biggest first.
 *
 * A group is the shop (payee) for merchants. For payments to a person it is the note when there
 * is one ("Rapido ride" covers Rinku, Aman and Udit), otherwise the person's name.
 */
export function breakdown(txns: Input[], period: Period): Breakdown {
  const cats = new Map<string, { total: number; count: number; groups: Map<string, MerchantTotal> }>();
  let total = 0;

  for (const t of txns) {
    if (t.type !== 'debit') continue;
    if (period !== 'all') {
      const d = new Date(t.occurred_at);
      if (d.getFullYear() !== period.year || d.getMonth() !== period.month) continue;
    }

    const name = t.category?.trim() || UNCATEGORISED;
    const cat = cats.get(name) ?? { total: 0, count: 0, groups: new Map() };
    cat.total += t.amount;
    cat.count += 1;

    const who = t.merchant ?? 'Unknown';
    const note = t.note?.trim() || null;
    const byNote = t.payee_kind === 'person' && note;
    const key = byNote ? `note:${note.toLowerCase()}` : (t.payee_key ?? who.toLowerCase());
    const label = byNote ? note : who;

    const g = cat.groups.get(key) ?? { key, label, total: 0, count: 0, items: [] };
    g.total += t.amount;
    g.count += 1;
    g.items.push({ id: t.id, who, note, amount: t.amount, date: t.occurred_at });
    cat.groups.set(key, g);

    cats.set(name, cat);
    total += t.amount;
  }

  const round = (n: number) => Math.round(n * 100) / 100;
  const categories = [...cats.entries()]
    .map(([name, c]) => ({
      name,
      total: round(c.total),
      count: c.count,
      merchants: [...c.groups.values()]
        .map((g) => ({ ...g, total: round(g.total), items: g.items.sort((a, b) => b.date.localeCompare(a.date)) }))
        .sort((a, b) => b.total - a.total),
    }))
    .sort((a, b) => b.total - a.total);

  return { total: round(total), categories };
}

export const breakdownForMonth = (txns: Input[], year: number, month: number) => breakdown(txns, { year, month });

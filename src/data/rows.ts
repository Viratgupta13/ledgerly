import { suggestCategory } from '../constants/brands';
import { dedupeKey, type ParsedTxn, type RawSms } from '../parser';
import type { TxnRow } from './types';

type History = Pick<TxnRow, 'type' | 'payee_key' | 'category' | 'occurred_at'>;

/**
 * What the user has actually chosen before: for each payee, the category they confirmed most
 * often (ties go to the most recent). This is how "Blinkit -> Food" is learned without a switch.
 */
export function buildHistory(confirmed: History[]): Map<string, string> {
  const stats = new Map<string, Map<string, { n: number; latest: string }>>();
  for (const t of confirmed) {
    if (t.type !== 'debit' || !t.payee_key || !t.category) continue;
    const byCat = stats.get(t.payee_key) ?? new Map();
    const s = byCat.get(t.category) ?? { n: 0, latest: '' };
    s.n += 1;
    if (t.occurred_at > s.latest) s.latest = t.occurred_at;
    byCat.set(t.category, s);
    stats.set(t.payee_key, byCat);
  }
  const result = new Map<string, string>();
  for (const [payee, byCat] of stats) {
    const best = [...byCat.entries()].sort((a, b) => b[1].n - a[1].n || b[1].latest.localeCompare(a[1].latest))[0];
    result.set(payee, best[0]);
  }
  return result;
}

/** Category to pre-fill for a payee: explicit rule, then learned history, then a well-known brand. */
export function predefinedCategory(
  payeeKey: string | null,
  rules: Map<string, string>,
  history: Map<string, string>,
): string | null {
  if (!payeeKey) return null;
  return rules.get(payeeKey) ?? history.get(payeeKey) ?? suggestCategory(payeeKey);
}

/**
 * Turns parsed SMS into rows for the transactions table. Everything starts `pending`, so the
 * user always gets one look at it; debits arrive with a category already filled in when we know
 * the payee. Credits never get a category.
 */
export function buildRows(
  userId: string,
  items: { sms: RawSms; txn: ParsedTxn }[],
  rules: Map<string, string>,
  history: Map<string, string>,
) {
  return items.map(({ sms, txn }) => ({
    user_id: userId,
    amount: txn.amount,
    type: txn.type,
    merchant: txn.merchant,
    payee_key: txn.payeeKey,
    payee_kind: txn.payeeKind,
    category: txn.type === 'debit' ? predefinedCategory(txn.payeeKey, rules, history) : null,
    bank_ref: dedupeKey(sms, txn),
    occurred_at: txn.occurredAt,
    status: 'pending' as const,
  }));
}

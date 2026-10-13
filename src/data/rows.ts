import { suggestCategory } from '../constants/brands';
import { dedupeKey, type ParsedTxn, type RawSms } from '../parser';

/**
 * Turns parsed SMS into rows for the transactions table.
 *
 * - A saved user rule for the payee means the user already decided: category set and confirmed.
 * - Otherwise a well-known brand gets a suggested category but stays pending for review.
 * - Credits and unknown payees stay pending with no category.
 */
export function buildRows(userId: string, items: { sms: RawSms; txn: ParsedTxn }[], rules: Map<string, string>) {
  return items.map(({ sms, txn }) => {
    const isDebit = txn.type === 'debit';
    const ruled = isDebit && txn.payeeKey ? rules.get(txn.payeeKey) : undefined;
    const suggested = isDebit && !ruled ? suggestCategory(txn.payeeKey) : null;
    return {
      user_id: userId,
      amount: txn.amount,
      type: txn.type,
      merchant: txn.merchant,
      payee_key: txn.payeeKey,
      payee_kind: txn.payeeKind,
      category: ruled ?? suggested ?? null,
      bank_ref: dedupeKey(sms, txn),
      occurred_at: txn.occurredAt,
      status: ruled ? ('confirmed' as const) : ('pending' as const),
    };
  });
}

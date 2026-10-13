import { classifySms, isTransactionSms } from './classify';
import {
  classifyPayee,
  extractAmount,
  extractBankRef,
  extractMerchant,
  extractOccurredAt,
  extractType,
  normalise,
  toPayeeKey,
} from './extract';
import { ParsedTxnSchema, type ParseResult, type RawSms } from './types';

export { classifySms, isTransactionSms };
export * from './types';

/** Turns one SMS into a transaction, or says why it is not one. Pure: no I/O, no UI deps. */
export function parseSms(sms: RawSms): ParseResult {
  const verdict = classifySms(sms.body);
  if (!verdict.genuine) return { ok: false, reason: verdict.reason };

  const text = normalise(sms.body);
  const amount = extractAmount(text);
  if (amount === null) return { ok: false, reason: 'no-amount' };
  const type = extractType(text);
  if (type === null) return { ok: false, reason: 'no-type' };

  const merchant = extractMerchant(text, type);
  const parsed = ParsedTxnSchema.safeParse({
    amount,
    type,
    merchant,
    payeeKey: toPayeeKey(merchant),
    payeeKind: classifyPayee(merchant, text),
    bankRef: extractBankRef(text),
    occurredAt: extractOccurredAt(text, sms.date),
  });
  return parsed.success ? { ok: true, txn: parsed.data } : { ok: false, reason: 'invalid' };
}

/**
 * Idempotency key for importing. Uses the bank reference when the SMS has one, otherwise a
 * deterministic fallback so re-scanning the inbox never creates duplicates.
 */
export function dedupeKey(sms: RawSms, txn: { bankRef: string | null; amount: number; type: string }): string {
  return txn.bankRef ?? `sms:${sms.address ?? 'unknown'}:${sms.date}:${txn.type}:${txn.amount}`;
}

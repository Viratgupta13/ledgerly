import { z } from 'zod';

/** A raw SMS as returned by the device inbox. `date` is epoch milliseconds (received time). */
export type RawSms = {
  body: string;
  address?: string;
  date: number;
};

export const ParsedTxnSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(['debit', 'credit']),
  merchant: z.string().min(1).nullable(),
  /** Stable, normalised identifier of the counterparty; the key for merchant_rules. */
  payeeKey: z.string().min(1).nullable(),
  /** Hint only: 'person' payments are the ones the user usually needs to label. */
  payeeKind: z.enum(['person', 'merchant', 'unknown']),
  bankRef: z.string().min(1).nullable(),
  occurredAt: z.iso.datetime(),
});

export type ParsedTxn = z.infer<typeof ParsedTxnSchema>;

export type RejectReason =
  | 'otp'
  | 'promo'
  | 'recharge'
  | 'failed'
  | 'request'
  | 'reminder'
  | 'not-transaction';

export type ParseResult =
  | { ok: true; txn: ParsedTxn }
  | { ok: false; reason: RejectReason | 'no-amount' | 'no-type' | 'invalid' };

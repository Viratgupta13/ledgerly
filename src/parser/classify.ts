import type { RejectReason } from './types';

const FAILED = /\b(failed|declined|unsuccessful|not successful|could not be processed|insufficient (?:funds|balance))\b/i;
const REQUEST = /\b(?:has requested|is requesting|requested (?:you|money|rs|inr)|collect request|payment request|money request)\b/i;
const REMINDER =
  /\b(?:will be debited|to be debited|scheduled|is due|are due|due (?:on|by|date)|min(?:imum)?\s*(?:amount\s*)?due|total\s*(?:amount\s*)?due|overdue|pay (?:by|before)|bill (?:of|amount|generated))\b/i;
const OTP_WORD = /\b(?:otp|one[- ]?time password|verification code|security code|cvv)\b/i;
const OTP_CODE = /(?:\b(?:otp|code|password|pin)\b[^\d\n]{0,12}\d{4,8}\b|\b\d{4,8}\s+is\s+(?:your|the)\b)/i;
const RECHARGE = /\b(?:recharge|data pack|talk\s?time|validity|prepaid plan|plan (?:expires|expiring|expired))\b/i;
const PROMO =
  /\b(?:offer|congratulations|congrats|pre-?approved|apply now|avail|win|reward|coupon|discount|cashback|loan|upgrade|limited period|t&c|t\s?&\s?c|click|visit|download|http|www\.|bit\.ly)\b/i;

/** Past-tense verbs that mean money has actually moved. */
const MONEY_MOVED =
  /\b(?:debited|credited|spent|paid|sent|received|withdrawn|deposited|purchased?|refunded|transferred|trf|debit|credit|used (?:for|at))\b/i;
const HAS_AMOUNT = /(?:\b(?:rs|inr)\.?|₹)\s*\d/i;
/** Something that ties the message to an account, card or payment rail. */
const ACCOUNT_MARKER = /(?:a\/c|\bacct?\b|\baccount\b|\bcard\b|\bupi\b|\bvpa\b|\bimps\b|\bneft\b|\brtgs\b|\bx{2,}\d{2,}|\*{1,}\d{3,4}\b|\bx\d{3,4}\b|\bref(?:no|erence)?\b)/i;

function isStrongTxn(body: string): boolean {
  // "Credit Card" / "Debit Card" name an instrument, not money moving.
  const verbs = body.replace(/\b(?:credit|debit)\s+card\b/gi, 'card');
  return MONEY_MOVED.test(verbs) && (HAS_AMOUNT.test(body) || /(?:debited|credited)\s+(?:by|with|for)\s+\d/i.test(body)) && ACCOUNT_MARKER.test(body);
}

export type Classification = { genuine: true } | { genuine: false; reason: RejectReason };

/**
 * Decides whether an SMS reports a completed money movement.
 * Order matters: hard rejects first (failed / request / reminder / OTP), then a positive
 * check that the message really reports money moving on an account, card or UPI rail.
 */
export function classifySms(body: string): Classification {
  const text = body.replace(/\s+/g, ' ').trim();

  if (FAILED.test(text)) return { genuine: false, reason: 'failed' };
  if (REQUEST.test(text)) return { genuine: false, reason: 'request' };
  if (REMINDER.test(text)) return { genuine: false, reason: 'reminder' };
  if (OTP_WORD.test(text) && (OTP_CODE.test(text) || !MONEY_MOVED.test(text))) {
    return { genuine: false, reason: 'otp' };
  }

  if (isStrongTxn(text)) return { genuine: true };

  if (RECHARGE.test(text)) return { genuine: false, reason: 'recharge' };
  if (PROMO.test(text)) return { genuine: false, reason: 'promo' };
  return { genuine: false, reason: 'not-transaction' };
}

export function isTransactionSms(body: string): boolean {
  return classifySms(body).genuine;
}

/** Field extractors. Each takes a whitespace-normalised SMS body. */

const BALANCE_CONTEXT = /(?:avl|avail\w*|bal\w*|limit|lmt|outstanding|due)\W{0,20}$/i;

export function normalise(body: string): string {
  return body.replace(/\s+/g, ' ').trim();
}

export function extractAmount(text: string): number | null {
  const re = /(?:\b(?:rs|inr)\.?|₹)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/gi;
  for (const m of text.matchAll(re)) {
    const before = text.slice(Math.max(0, m.index - 25), m.index);
    if (BALANCE_CONTEXT.test(before)) continue;
    const value = Number(m[1].replace(/,/g, ''));
    if (value > 0) return value;
  }
  // SBI style: "debited by 500.0" with no currency marker.
  const bare = text.match(/\b(?:debited|credited)\s+(?:by|with|for)\s+([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i);
  if (bare) {
    const value = Number(bare[1].replace(/,/g, ''));
    if (value > 0) return value;
  }
  return null;
}

const DEBIT_VERB =
  /\b(?:debited|debit|spent|paid|sent|withdrawn|withdrawal|purchased?|purchase|transferred to|trf to|charged|used (?:for|at))\b/i;
const CREDIT_VERB = /\b(?:credited|credit|received|deposited|refunded|refund|reversed)\b/i;

/** The first money verb in the message decides direction. */
export function extractType(text: string): 'debit' | 'credit' | null {
  // "Credit Card" / "Debit Card" name an instrument, not a direction.
  const cleaned = text.replace(/\b(?:credit|debit)\s+card\b/gi, 'card');
  const d = cleaned.search(DEBIT_VERB);
  const c = cleaned.search(CREDIT_VERB);
  if (d === -1 && c === -1) return null;
  if (d === -1) return 'credit';
  if (c === -1) return 'debit';
  return d < c ? 'debit' : 'credit';
}

export function extractBankRef(text: string): string | null {
  const patterns = [
    /\bUPI\/(?:P2M|P2A|P2P)\/(\d{6,22})\b/i,
    /\b(?:upi\s*)?(?:ref(?:erence)?\.?\s*(?:no\.?|number|id)?|refno|rrn|utr|txn\s*(?:id|no\.?))\s*[:\-#]?\s*(\d{6,22})\b/i,
    /\bUPI\s*[:\-]\s*(\d{6,22})\b/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return null;
}

const VPA = /\b([a-z0-9._-]{2,}@[a-z][a-z0-9]{1,})\b/i;
const NAME = "[A-Za-z0-9][A-Za-z0-9 &.'*\\-]*?";
const STOP = String.raw`(?=\s+(?:on|ref|refno|upi|via|using|from|to|not you|if not|call|avl|bal)\b|\s*[.,(;]|\s+-\s|$)`;
const NOT_AN_ACCOUNT = String.raw`(?!(?:a\/c|ac|acct|account|your|the|card|vpa|xx|x\d|\*)\b)`;

function clean(raw: string | undefined): string | null {
  if (!raw) return null;
  const name = raw.replace(/\s+/g, ' ').replace(/^[\s\-.*]+|[\s\-.,;:*]+$/g, '').slice(0, 60);
  if (name.length < 2 || /^[\d\s]+$/.test(name)) return null;
  return name;
}

export function extractMerchant(text: string, type: 'debit' | 'credit'): string | null {
  // Axis style: UPI/P2M/<ref>/<NAME>
  const slash = text.match(/\bUPI\/(?:P2M|P2A|P2P)\/\d+\/([^/]+?)(?:\s*(?:SMS|Not you|Call)\b|\/|$)/i);
  const slashName = clean(slash?.[1]);
  if (slashName) return slashName;

  // "to VPA x@y" / "from VPA x@y": the handle is the best identity we get.
  const vpaCtx = text.match(/\b(?:to|from|by)\s+VPA\s+([a-z0-9._-]{2,}@[a-z][a-z0-9]{1,})/i);
  if (vpaCtx) return vpaCtx[1].toLowerCase();

  // ICICI style: "; NAME credited."
  const iciciName = type === 'debit' ? clean(text.match(new RegExp(`;\\s*(${NAME})\\s+credited\\b`, 'i'))?.[1]) : null;
  if (iciciName) return iciciName;

  // Card spend: "at NAME on ..."
  const at = clean(text.match(new RegExp(`\\b(?:at|@)\\s+(${NAME})${STOP}`, 'i'))?.[1]);
  if (type === 'debit' && at) return at;

  const patterns =
    type === 'debit'
      ? [`\\b(?:trf to|to|towards)\\s+${NOT_AN_ACCOUNT}(${NAME})${STOP}`]
      : [`\\bfrom\\s+${NOT_AN_ACCOUNT}(${NAME})${STOP}`, `\\bby\\s+${NOT_AN_ACCOUNT}(?!(?:neft|imps|rtgs|upi|cash|cheque)\\b)(${NAME})${STOP}`];
  for (const p of patterns) {
    const found = clean(text.match(new RegExp(p, 'i'))?.[1]);
    if (found) return found;
  }

  const anyVpa = text.match(VPA);
  return anyVpa ? anyVpa[1].toLowerCase() : null;
}

const NOISE_TOKENS = new Set(['pvt', 'ltd', 'limited', 'private', 'india', 'upi', 'payment', 'payments']);

/** Normalise a merchant string into a stable key for merchant_rules lookups. */
export function toPayeeKey(merchant: string | null): string | null {
  if (!merchant) return null;
  if (/^[a-z0-9._-]+@[a-z0-9]+$/i.test(merchant)) return merchant.toLowerCase();
  const key = merchant
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(' ')
    .filter((t) => t && !NOISE_TOKENS.has(t))
    .join(' ');
  return key || null;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const TIME = String.raw`(?:[ :T,]+(\d{2}):(\d{2})(?::(\d{2}))?)?`;

function fromIst(y: number, mo: number, d: number, h = 0, mi = 0, s = 0): { ms: number; hasTime: boolean } | null {
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || s > 59) return null;
  const year = y < 100 ? 2000 + y : y;
  return { ms: Date.UTC(year, mo - 1, d, h, mi, s) - IST_OFFSET_MS, hasTime: false };
}

const istDay = (ms: number) => Math.floor((ms + IST_OFFSET_MS) / 86_400_000);

/**
 * Finds a transaction date in the body (interpreted as IST) and returns an ISO string.
 * Falls back to the SMS received time. A date-only match on the same IST day as the SMS
 * keeps the SMS time-of-day instead of snapping to midnight.
 */
export function extractOccurredAt(text: string, smsDate: number): string {
  let found: { ms: number; hasTime: boolean } | null = null;
  const num = (v: string | undefined) => (v === undefined ? undefined : Number(v));

  const iso = text.match(new RegExp(String.raw`\b(\d{4})-(\d{2})-(\d{2})${TIME}`));
  const named = text.match(new RegExp(String.raw`\b(\d{1,2})[- ]?(${MONTHS.join('|')})[a-z]*[- ,]*(\d{2,4})\b${TIME}`, 'i'));
  const dmy = text.match(new RegExp(String.raw`\b(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\b${TIME}`));

  if (iso) {
    found = fromIst(+iso[1], +iso[2], +iso[3], num(iso[4]), num(iso[5]), num(iso[6]));
    if (found) found.hasTime = iso[4] !== undefined;
  } else if (named) {
    found = fromIst(+named[3], MONTHS.indexOf(named[2].toLowerCase()) + 1, +named[1], num(named[4]), num(named[5]), num(named[6]));
    if (found) found.hasTime = named[4] !== undefined;
  } else if (dmy) {
    found = fromIst(+dmy[3], +dmy[2], +dmy[1], num(dmy[4]), num(dmy[5]), num(dmy[6]));
    if (found) found.hasTime = dmy[4] !== undefined;
  }

  if (!found) return new Date(smsDate).toISOString();
  if (!found.hasTime && istDay(found.ms) === istDay(smsDate)) return new Date(smsDate).toISOString();
  return new Date(found.ms).toISOString();
}

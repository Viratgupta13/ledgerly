import { SCAN_CUTOFF_DAYS, buildDemoSms, type DemoSms } from './fixtures';
import type { CategoryRow, RuleRow, TxnRow, TxnStatus } from '../data/types';
import { buildHistory, buildRows, predefinedCategory } from '../data/rows';
import { parseSms, type ParsedTxn, type RawSms } from '../parser';

/**
 * In-memory stand-in for the Supabase backend, used by "Try demo". It follows the same rules as
 * the real thing (unique bank ref, rule > history > brand pre-fill) and runs the real parser.
 */
let sms: DemoSms[] = [];
let txns: TxnRow[] = [];
let rules: RuleRow[] = [];
let categories: CategoryRow[] = [];
let seq = 0;
const nid = (p: string) => `${p}-${++seq}`;

type NewPayment = Pick<TxnRow, 'amount' | 'type' | 'merchant' | 'category'>;

export function resetDemo(now = Date.now()): void {
  seq = 0;
  sms = buildDemoSms(now);
  txns = [];
  rules = [];
  categories = [];
  // A few rules the user would already have made, so the Rules tab is not empty.
  for (const [key, category] of [['blinkit', 'Food'], ['zomato', 'Food'], ['swiggy', 'Food'], ['uber@axisbank', 'Transport'], ['ramesh kumar', 'Rent']]) {
    rules.push({ id: nid('r'), payee_key: key, category });
  }
  for (const m of sms.filter((x) => x.daysAgo >= SCAN_CUTOFF_DAYS)) {
    const r = parseSms(m);
    if (!r.ok) continue;
    const [row] = buildRows('demo', [{ sms: m, txn: r.txn }], new Map(), new Map());
    txns.push({
      id: nid('t'),
      amount: row.amount,
      type: row.type,
      merchant: row.merchant,
      category: row.type === 'debit' ? (m.seed?.category ?? row.category) : null,
      bank_ref: row.bank_ref,
      occurred_at: row.occurred_at,
      status: 'confirmed',
      note: m.seed?.note ?? null,
      payee_key: row.payee_key,
      payee_kind: row.payee_kind,
    });
  }
}

export const demoInbox = (): RawSms[] => sms.map(({ body, address, date }) => ({ body, address, date }));

export const demoListTxns = (status: TxnStatus): TxnRow[] =>
  txns.filter((t) => t.status === status).sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));

export const demoListRules = (): RuleRow[] => [...rules].sort((a, b) => a.payee_key.localeCompare(b.payee_key));

export const demoDeleteRule = (id: string) => {
  rules = rules.filter((r) => r.id !== id);
};

export function demoSaveRule(payeeKey: string, category: string) {
  const existing = rules.find((r) => r.payee_key === payeeKey);
  if (existing) existing.category = category;
  else rules.push({ id: nid('r'), payee_key: payeeKey, category });
}

export function demoImport(items: { sms: RawSms; txn: ParsedTxn }[]): { added: number; payments: NewPayment[] } {
  const ruleMap = new Map(rules.map((r) => [r.payee_key, r.category]));
  const history = buildHistory(txns.filter((t) => t.status === 'confirmed'));
  const payments: NewPayment[] = [];
  for (const row of buildRows('demo', items, ruleMap, history)) {
    if (txns.some((t) => t.bank_ref === row.bank_ref)) continue; // same bank ref: already imported
    txns.push({
      id: nid('t'),
      amount: row.amount,
      type: row.type,
      merchant: row.merchant,
      category: row.category,
      bank_ref: row.bank_ref,
      occurred_at: row.occurred_at,
      status: 'pending',
      note: null,
      payee_key: row.payee_key,
      payee_kind: row.payee_kind,
    });
    payments.push({ amount: row.amount, type: row.type, merchant: row.merchant, category: row.category });
  }
  return { added: payments.length, payments };
}

export function demoApplyPredefined(): number {
  const ruleMap = new Map(rules.map((r) => [r.payee_key, r.category]));
  const history = buildHistory(txns.filter((t) => t.status === 'confirmed'));
  let n = 0;
  for (const t of txns) {
    if (t.status !== 'pending' || t.type !== 'debit' || t.category) continue;
    const c = predefinedCategory(t.payee_key, ruleMap, history);
    if (c) {
      t.category = c;
      n += 1;
    }
  }
  return n;
}

export function demoReview(input: { id: string; status: TxnStatus; category: string | null; note: string | null }) {
  const t = txns.find((x) => x.id === input.id);
  if (t) Object.assign(t, { status: input.status, category: input.category, note: input.note });
}

export function demoConfirmBatch(updates: { id: string; category: string }[]): number {
  let n = 0;
  for (const u of updates) {
    const t = txns.find((x) => x.id === u.id && x.status === 'pending');
    if (t) {
      t.status = 'confirmed';
      t.category = u.category;
      n += 1;
    }
  }
  return n;
}

export const demoListCategories = (): CategoryRow[] => [...categories];
export function demoAddCategory(name: string) {
  if (!categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) categories.push({ id: nid('c'), name: name.trim() });
}
export const demoCountPending = (): number => txns.filter((t) => t.status === 'pending').length;

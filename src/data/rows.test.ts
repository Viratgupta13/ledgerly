import { suggestCategory } from '../constants/brands';
import type { ParsedTxn } from '../parser';
import { buildHistory, buildRows, predefinedCategory } from './rows';

const sms = { body: 'x', address: 'AX-BANK', date: 1_700_000_000_000 };
const txn = (over: Partial<ParsedTxn> = {}): ParsedTxn => ({
  amount: 100,
  type: 'debit',
  merchant: 'BLINKIT',
  payeeKey: 'blinkit',
  payeeKind: 'merchant',
  bankRef: '428812345678',
  occurredAt: '2024-10-12T04:50:30.000Z',
  ...over,
});
const none = new Map<string, string>();
const row = (t: ParsedTxn, rules = none, history = none) => buildRows('u1', [{ sms, txn: t }], rules, history)[0];

describe('buildHistory', () => {
  const h = (payee: string, category: string, day: number, type: 'debit' | 'credit' = 'debit') => ({
    type,
    payee_key: payee,
    category,
    occurred_at: `2024-10-${String(day).padStart(2, '0')}T10:00:00.000Z`,
  });

  it('learns the most used category per payee', () => {
    const map = buildHistory([h('blinkit', 'Food', 1), h('blinkit', 'Food', 2), h('blinkit', 'Shopping', 3), h('rapido', 'Transport', 4)]);
    expect(map.get('blinkit')).toBe('Food');
    expect(map.get('rapido')).toBe('Transport');
  });

  it('breaks ties with the most recent choice', () => {
    expect(buildHistory([h('x', 'Food', 1), h('x', 'Bills', 5)]).get('x')).toBe('Bills');
  });

  it('ignores credits, uncategorised and payee-less rows', () => {
    const map = buildHistory([
      h('a', 'Food', 1, 'credit'),
      { type: 'debit', payee_key: 'b', category: null, occurred_at: '2024-10-01T00:00:00.000Z' },
      { type: 'debit', payee_key: null, category: 'Food', occurred_at: '2024-10-01T00:00:00.000Z' },
    ]);
    expect(map.size).toBe(0);
  });
});

describe('predefinedCategory', () => {
  it('prefers rule, then history, then brand list', () => {
    expect(predefinedCategory('blinkit', new Map([['blinkit', 'Rent']]), new Map([['blinkit', 'Bills']]))).toBe('Rent');
    expect(predefinedCategory('blinkit', none, new Map([['blinkit', 'Bills']]))).toBe('Bills');
    expect(predefinedCategory('blinkit', none, none)).toBe('Food');
    expect(predefinedCategory('rinku', none, none)).toBeNull();
    expect(predefinedCategory(null, none, none)).toBeNull();
  });
});

describe('buildRows', () => {
  it('pre-fills a learned category but always leaves the row pending for review', () => {
    expect(row(txn({ merchant: 'KIRANA', payeeKey: 'kirana' }), none, new Map([['kirana', 'Essential']]))).toMatchObject({
      category: 'Essential',
      status: 'pending',
    });
  });

  it('pre-fills a rule and keeps it pending', () => {
    expect(row(txn(), new Map([['blinkit', 'Shopping']]))).toMatchObject({ category: 'Shopping', status: 'pending' });
  });

  it('leaves unknown payees uncategorised', () => {
    expect(row(txn({ merchant: 'RINKU', payeeKey: 'rinku', payeeKind: 'person' }))).toMatchObject({ category: null, status: 'pending' });
  });

  it('never categorises a credit', () => {
    expect(row(txn({ type: 'credit' }), new Map([['blinkit', 'Food']]), new Map([['blinkit', 'Food']]))).toMatchObject({
      category: null,
      status: 'pending',
    });
  });

  it('uses the bank ref as the dedupe key', () => {
    expect(row(txn()).bank_ref).toBe('428812345678');
  });
});

describe('suggestCategory', () => {
  it.each([
    ['zomato', 'Food'],
    ['zomato-order@hdfcbank', 'Food'],
    ['swiggy instamart', 'Food'],
    ['ola', 'Transport'],
    ['rapido', 'Transport'],
    ['amazon pay', 'Shopping'],
    ['jio', 'Bills'],
  ])('%s -> %s', (key, category) => expect(suggestCategory(key)).toBe(category));

  it('does not match a brand inside another word', () => {
    expect(suggestCategory('solanki')).toBeNull();
    expect(suggestCategory('olaf kumar')).toBeNull();
  });

  it('returns null for unknown or missing payees', () => {
    expect(suggestCategory('rinku singh')).toBeNull();
    expect(suggestCategory(null)).toBeNull();
  });
});

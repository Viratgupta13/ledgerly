import { suggestCategory } from '../constants/brands';
import type { ParsedTxn } from '../parser';
import { buildRows } from './rows';

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
const row = (t: ParsedTxn, rules = new Map<string, string>()) => buildRows('u1', [{ sms, txn: t }], rules)[0];

describe('buildRows', () => {
  it('confirms and categorises a payee that has a user rule', () => {
    const r = row(txn(), new Map([['blinkit', 'Shopping']]));
    expect(r).toMatchObject({ category: 'Shopping', status: 'confirmed' });
  });

  it('prefers the user rule over the built-in suggestion', () => {
    expect(row(txn(), new Map([['blinkit', 'Essential']])).category).toBe('Essential');
  });

  it('suggests but does not confirm a well-known brand', () => {
    expect(row(txn())).toMatchObject({ category: 'Food', status: 'pending' });
  });

  it('leaves unknown payees uncategorised and pending', () => {
    expect(row(txn({ merchant: 'RINKU', payeeKey: 'rinku', payeeKind: 'person' }))).toMatchObject({
      category: null,
      status: 'pending',
    });
  });

  it('never categorises a credit', () => {
    const r = row(txn({ type: 'credit' }), new Map([['blinkit', 'Food']]));
    expect(r).toMatchObject({ category: null, status: 'pending' });
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

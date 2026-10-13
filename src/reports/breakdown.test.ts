import { breakdown, breakdownForMonth, UNCATEGORISED } from './breakdown';

let n = 0;
const tx = (over: Partial<Parameters<typeof breakdownForMonth>[0][number]> = {}) => ({
  id: `t${n++}`,
  amount: 100,
  type: 'debit' as const,
  merchant: 'ZOMATO',
  payee_key: 'zomato',
  payee_kind: 'merchant' as const,
  category: 'Food',
  note: null,
  occurred_at: '2024-10-15T06:30:00.000Z',
  ...over,
});

describe('breakdownForMonth', () => {
  it('groups spend by category then merchant, biggest first', () => {
    const r = breakdownForMonth(
      [
        tx({ amount: 250 }),
        tx({ amount: 150 }),
        tx({ merchant: 'BLINKIT', payee_key: 'blinkit', amount: 300 }),
        tx({ category: 'Transport', merchant: 'RAPIDO', payee_key: 'rapido', amount: 90 }),
      ],
      2024,
      9,
    );
    expect(r.total).toBe(790);
    expect(r.categories.map((c) => c.name)).toEqual(['Food', 'Transport']);
    expect(r.categories[0].merchants).toMatchObject([
      { label: 'ZOMATO', total: 400, count: 2 },
      { label: 'BLINKIT', total: 300, count: 1 },
    ]);
  });

  it('ignores credits and other months', () => {
    const r = breakdownForMonth(
      [tx({ type: 'credit', amount: 5000 }), tx({ occurred_at: '2024-09-15T06:30:00.000Z' }), tx({ amount: 40 })],
      2024,
      9,
    );
    expect(r.total).toBe(40);
  });

  it('puts missing categories under Uncategorised', () => {
    const r = breakdownForMonth([tx({ category: null })], 2024, 9);
    expect(r.categories[0].name).toBe(UNCATEGORISED);
  });

  it('avoids floating point drift', () => {
    const r = breakdownForMonth([tx({ amount: 0.1 }), tx({ amount: 0.2 })], 2024, 9);
    expect(r.total).toBe(0.3);
  });
});

describe('person payments', () => {
  const driver = (merchant: string, note: string | null, amount: number) =>
    tx({
      category: 'Transport',
      merchant,
      payee_key: merchant.toLowerCase(),
      payee_kind: 'person',
      note,
      amount,
    });

  it('groups different drivers under one note and keeps who was paid', () => {
    const r = breakdownForMonth(
      [driver('RINKU', 'Rapido ride', 80), driver('AMAN SINGH', 'rapido ride', 60), driver('UDIT', 'Ola ride', 120)],
      2024,
      9,
    );
    const groups = r.categories[0].merchants;
    expect(groups.map((g) => [g.label, g.total])).toEqual([
      ['Rapido ride', 140],
      ['Ola ride', 120],
    ]);
    expect(groups[0].items.map((i) => i.who).sort()).toEqual(['AMAN SINGH', 'RINKU']);
  });

  it('falls back to the person name when there is no note', () => {
    const r = breakdownForMonth([driver('RINKU', null, 80), driver('RINKU', null, 20)], 2024, 9);
    expect(r.categories[0].merchants).toMatchObject([{ label: 'RINKU', total: 100, count: 2 }]);
  });

  it('keeps merchants grouped by shop even if a note is set', () => {
    const r = breakdownForMonth([tx({ note: 'dinner' }), tx({ note: 'lunch' })], 2024, 9);
    expect(r.categories[0].merchants).toMatchObject([{ label: 'ZOMATO', count: 2 }]);
  });
});

describe('all-time period', () => {
  it('includes every month', () => {
    const r = breakdown([tx({ amount: 10 }), tx({ amount: 5, occurred_at: '2024-08-01T06:30:00.000Z' })], 'all');
    expect(r.total).toBe(15);
  });
});

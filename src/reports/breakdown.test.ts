import { breakdownForMonth, UNCATEGORISED } from './breakdown';

const tx = (over: Partial<Parameters<typeof breakdownForMonth>[0][number]>) => ({
  amount: 100,
  type: 'debit' as const,
  merchant: 'ZOMATO',
  payee_key: 'zomato',
  category: 'Food',
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

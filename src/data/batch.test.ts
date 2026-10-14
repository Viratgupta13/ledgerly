import { groupBatch, type BatchItem } from './batch';

const item = (id: string, merchant: string, amount: number, category: string | null, day = 12): BatchItem => ({
  id,
  merchant,
  payee_key: merchant.toLowerCase(),
  amount,
  occurred_at: `2024-10-${String(day).padStart(2, '0')}T04:50:30.000Z`,
  category,
});

describe('groupBatch', () => {
  const items = [
    item('a', 'BLINKIT', 100, 'Food', 10),
    item('b', 'BLINKIT', 250, 'Food', 12),
    item('c', 'ZOMATO', 80, 'Food'),
    item('d', 'RAPIDO', 60, 'Transport'),
  ];

  it('groups category -> payee, biggest first, with counts', () => {
    const g = groupBatch(items, new Map(), new Set());
    expect(g.map((c) => [c.category, c.total, c.count])).toEqual([['Food', 430, 3], ['Transport', 60, 1]]);
    expect(g[0].payees.map((p) => [p.label, p.total, p.items.length])).toEqual([
      ['BLINKIT', 350, 2],
      ['ZOMATO', 80, 1],
    ]);
  });

  it('lists a payee\'s payments newest first', () => {
    expect(groupBatch(items, new Map(), new Set())[0].payees[0].items.map((i) => i.id)).toEqual(['b', 'a']);
  });

  it('moves a whole payee when every one of its payments is overridden', () => {
    const g = groupBatch(items, new Map([['a', 'Shopping'], ['b', 'Shopping']]), new Set());
    expect(g.map((c) => c.category)).toEqual(['Shopping', 'Food', 'Transport']);
    expect(g[0].payees[0]).toMatchObject({ label: 'BLINKIT', total: 350 });
  });

  it('splits a payee across categories when only one payment is changed', () => {
    const g = groupBatch(items, new Map([['a', 'Bills']]), new Set());
    const food = g.find((c) => c.category === 'Food');
    const bills = g.find((c) => c.category === 'Bills');
    expect(food?.payees.find((p) => p.label === 'BLINKIT')?.total).toBe(250);
    expect(bills?.payees[0]).toMatchObject({ label: 'BLINKIT', total: 100 });
  });

  it('drops removed payments and empty groups', () => {
    const g = groupBatch(items, new Map(), new Set(['d', 'a', 'b']));
    expect(g.map((c) => c.category)).toEqual(['Food']);
    expect(g[0].payees.map((p) => p.label)).toEqual(['ZOMATO']);
  });

  it('skips payments with no category', () => {
    expect(groupBatch([item('x', 'KIRANA', 10, null)], new Map(), new Set())).toEqual([]);
  });
});

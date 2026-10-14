import { groupBatch, type BatchItem } from './batch';

const item = (id: string, amount: number, category: string | null): BatchItem => ({
  id,
  merchant: id.toUpperCase(),
  amount,
  occurred_at: '2024-10-12T04:50:30.000Z',
  category,
});

describe('groupBatch', () => {
  const items = [item('a', 100, 'Food'), item('b', 250, 'Food'), item('c', 80, 'Transport')];

  it('groups by category, biggest first', () => {
    const g = groupBatch(items, new Map(), new Set());
    expect(g.map((x) => [x.category, x.total])).toEqual([['Food', 350], ['Transport', 80]]);
  });

  it('applies category changes made in the preview', () => {
    const g = groupBatch(items, new Map([['b', 'Shopping']]), new Set());
    expect(g.map((x) => [x.category, x.total])).toEqual([['Shopping', 250], ['Food', 100], ['Transport', 80]]);
  });

  it('drops removed payments', () => {
    const g = groupBatch(items, new Map(), new Set(['a', 'c']));
    expect(g).toHaveLength(1);
    expect(g[0].items.map((i) => i.id)).toEqual(['b']);
  });

  it('skips payments with no category', () => {
    expect(groupBatch([item('x', 10, null)], new Map(), new Set())).toEqual([]);
  });
});

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
    const { groups } = groupBatch(items, new Map(), new Set());
    expect(groups.map((x) => [x.category, x.total])).toEqual([['Food', 350], ['Transport', 80]]);
  });

  it('applies category changes made in the preview', () => {
    const { groups } = groupBatch(items, new Map([['b', 'Shopping']]), new Set());
    expect(groups.map((x) => [x.category, x.total])).toEqual([['Shopping', 250], ['Food', 100], ['Transport', 80]]);
  });

  it('drops removed payments', () => {
    const { groups, missing } = groupBatch(items, new Map(), new Set(['a', 'c']));
    expect(groups).toHaveLength(1);
    expect(groups[0].items.map((i) => i.id)).toEqual(['b']);
    expect(missing).toEqual([]);
  });

  it('lists payments with no category as missing instead of saving them', () => {
    const { groups, missing } = groupBatch([item('x', 10, null), item('y', 5, 'Food')], new Map(), new Set());
    expect(missing.map((i) => i.id)).toEqual(['x']);
    expect(groups.map((g) => g.category)).toEqual(['Food']);
  });

  it('moves a missing payment into a group once the user picks a category', () => {
    const { groups, missing } = groupBatch([item('x', 10, null)], new Map([['x', 'Rent']]), new Set());
    expect(missing).toEqual([]);
    expect(groups).toMatchObject([{ category: 'Rent', total: 10 }]);
  });
});

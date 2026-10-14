import { buildDemoSms, SCAN_CUTOFF_DAYS } from './fixtures';
import {
  demoConfirmBatch,
  demoImport,
  demoInbox,
  demoListTxns,
  resetDemo,
} from './db';
import { parseSms } from '../parser';

const NOW = Date.UTC(2026, 9, 14, 6, 0, 0);

describe('demo inbox', () => {
  const all = buildDemoSms(NOW);

  it('contains realistic payments and noise', () => {
    const parsed = all.map((m) => parseSms(m));
    const ok = parsed.filter((r) => r.ok);
    const rejected = parsed.filter((r) => !r.ok);
    expect(ok.length).toBeGreaterThanOrEqual(45);
    expect(rejected.map((r) => (r.ok ? '' : r.reason)).sort()).toEqual(['failed', 'otp', 'promo', 'recharge']);
  });

  it('keeps every payment bank-ref unique so imports are idempotent', () => {
    const refs = all.map((m) => parseSms(m)).flatMap((r) => (r.ok && r.txn.bankRef ? [r.txn.bankRef] : []));
    expect(new Set(refs).size).toBe(refs.length);
  });
});

describe('demo backend', () => {
  beforeEach(() => resetDemo(NOW));

  it('starts with confirmed history and an empty Inbox', () => {
    expect(demoListTxns('confirmed').length).toBeGreaterThan(25);
    expect(demoListTxns('pending')).toHaveLength(0);
  });

  it('scanning fills the Inbox, pre-sorting known payees, and never imports twice', () => {
    const inbox = demoInbox();
    const items = inbox.flatMap((m) => {
      const r = parseSms(m);
      return r.ok ? [{ sms: m, txn: r.txn }] : [];
    });
    const first = demoImport(items);
    expect(first.added).toBeGreaterThan(8);
    expect(demoImport(items).added).toBe(0);

    const pending = demoListTxns('pending');
    expect(pending.every((t) => new Date(t.occurred_at).getTime() >= NOW - (SCAN_CUTOFF_DAYS + 1) * 864e5)).toBe(true);
    expect(pending.filter((t) => t.type === 'debit' && t.category).length).toBeGreaterThanOrEqual(5);
    expect(pending.some((t) => t.type === 'debit' && !t.category)).toBe(true);
  });

  it('confirming a batch moves payments out of the Inbox', () => {
    const items = demoInbox().flatMap((m) => {
      const r = parseSms(m);
      return r.ok ? [{ sms: m, txn: r.txn }] : [];
    });
    demoImport(items);
    const ready = demoListTxns('pending').filter((t) => t.category);
    const before = demoListTxns('confirmed').length;
    demoConfirmBatch(ready.map((t) => ({ id: t.id, category: t.category as string })));
    expect(demoListTxns('confirmed').length).toBe(before + ready.length);
  });
});

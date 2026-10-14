import { newPaymentsMessage, reminderMessage, shouldSendReminder, todayKey, type NewPayment } from './messages';

const pay = (merchant: string | null, amount: number, category: string | null = null, type: 'debit' | 'credit' = 'debit'): NewPayment => ({
  merchant,
  amount,
  category,
  type,
});

describe('newPaymentsMessage', () => {
  it('shows only a count when details are hidden', () => {
    const m = newPaymentsMessage([pay('BLINKIT', 349, 'Food'), pay('RINKU', 80)], true);
    expect(m).toEqual({ title: 'New payments found', body: '2 new payments to review' });
    expect(JSON.stringify(m)).not.toMatch(/BLINKIT|349|RINKU/);
  });

  it('describes a single sorted payment', () => {
    expect(newPaymentsMessage([pay('BLINKIT', 349, 'Food')], false)).toEqual({
      title: 'Paid ₹349 · BLINKIT',
      body: 'Sorted as Food. Tap to review.',
    });
  });

  it('asks for a category when there is none, and calls credits "Received"', () => {
    expect(newPaymentsMessage([pay('KIRANA', 90)], false).body).toBe('Tap to add a category.');
    expect(newPaymentsMessage([pay('ACME', 52000, null, 'credit')], false).title).toBe('Received ₹52,000 · ACME');
  });

  it('summarises several payments with the amount spent and a few payees', () => {
    const m = newPaymentsMessage(
      [pay('BLINKIT', 349), pay('ZOMATO', 612.5), pay('RAPIDO', 80), pay('ACME', 1000, null, 'credit')],
      false,
    );
    expect(m.title).toBe('4 new payments · ₹1,041.5 spent');
    expect(m.body).toBe('BLINKIT, ZOMATO +2 more. Tap to review.');
  });

  it('uses singular wording for one hidden payment', () => {
    expect(newPaymentsMessage([pay('X', 1)], true).body).toBe('1 new payment to review');
  });
});

describe('reminderMessage', () => {
  it('hides the count when asked', () => {
    expect(reminderMessage(12, true).body).toBe('Open Expensefy to review them.');
    expect(reminderMessage(12, false).body).toBe('12 payments need a quick look.');
  });
});

describe('shouldSendReminder', () => {
  const at = (h: number) => new Date(2024, 9, 14, h, 5);

  it('waits for the chosen hour', () => {
    expect(shouldSendReminder({ now: at(20), hour: 21, lastSentDay: null, pending: 5 })).toBe(false);
    expect(shouldSendReminder({ now: at(21), hour: 21, lastSentDay: null, pending: 5 })).toBe(true);
  });

  it('sends at most once a day', () => {
    expect(shouldSendReminder({ now: at(22), hour: 21, lastSentDay: todayKey(at(22)), pending: 5 })).toBe(false);
    expect(shouldSendReminder({ now: at(22), hour: 21, lastSentDay: '2024-10-13', pending: 5 })).toBe(true);
  });

  it('stays quiet when nothing is pending', () => {
    expect(shouldSendReminder({ now: at(22), hour: 21, lastSentDay: null, pending: 0 })).toBe(false);
  });
});

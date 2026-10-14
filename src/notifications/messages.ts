export type NewPayment = { amount: number; type: 'debit' | 'credit'; merchant: string | null; category: string | null };

export type Message = { title: string; body: string };

const rupees = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * Notification text for newly found payments. With `hideDetails` the lock screen only shows a
 * count, never an amount or a payee.
 */
export function newPaymentsMessage(payments: NewPayment[], hideDetails: boolean): Message {
  const count = payments.length;
  if (hideDetails) return { title: 'New payments found', body: `${plural(count, 'new payment')} to review` };

  const debits = payments.filter((p) => p.type === 'debit');
  const spent = debits.reduce((n, p) => n + p.amount, 0);

  if (count === 1) {
    const p = payments[0];
    const who = p.merchant ?? 'Unknown payee';
    return {
      title: `${p.type === 'debit' ? 'Paid' : 'Received'} ${rupees(p.amount)} · ${who}`,
      body: p.category ? `Sorted as ${p.category}. Tap to review.` : 'Tap to add a category.',
    };
  }

  const names = [...new Set(payments.map((p) => p.merchant).filter((m): m is string => !!m))];
  const shown = names.slice(0, 2).join(', ');
  const more = names.length > 2 ? ` +${names.length - 2} more` : '';
  return {
    title: `${plural(count, 'new payment')}${debits.length ? ` · ${rupees(spent)} spent` : ''}`,
    body: shown ? `${shown}${more}. Tap to review.` : 'Tap to review.',
  };
}

export function reminderMessage(pending: number, hideDetails: boolean): Message {
  return {
    title: 'Payments waiting for review',
    body: hideDetails ? 'Open Ledgerly to review them.' : `${plural(pending, 'payment')} need a quick look.`,
  };
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

/** Once per day, only after the chosen hour, and only when something is actually pending. */
export function shouldSendReminder(opts: { now: Date; hour: number; lastSentDay: string | null; pending: number }): boolean {
  const { now, hour, lastSentDay, pending } = opts;
  return pending > 0 && now.getHours() >= hour && lastSentDay !== dayKey(now);
}

export const todayKey = (now = new Date()) => dayKey(now);

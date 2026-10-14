import { countPending } from '../data/api';
import { supabase } from '../lib/supabase';
import { reminderMessage, newPaymentsMessage, shouldSendReminder, todayKey } from '../notifications/messages';
import { hasNotificationPermission, showNotification } from '../notifications/notify';
import { getLastReminderDay, loadSettings, setLastReminderDay } from '../notifications/settings';
import { autoScan, type ScanSummary } from '../sms/scan';

export type CheckResult = {
  signedIn: boolean;
  summary: ScanSummary | null;
  notifiedNew: boolean;
  reminded: boolean;
};

/**
 * One pass of "look for new payments and tell the user". Used by the background task and by the
 * "Check now" button. Safe to run with the app closed: it only needs the stored session.
 */
export async function checkForNewPayments(): Promise<CheckResult> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return { signedIn: false, summary: null, notifiedNew: false, reminded: false };

  const [settings, summary, canNotify] = await Promise.all([loadSettings(), autoScan(userId), hasNotificationPermission()]);
  let notifiedNew = false;
  let reminded = false;

  if (canNotify && settings.newPayments && summary && summary.added > 0) {
    await showNotification(newPaymentsMessage(summary.payments, settings.hideDetails));
    notifiedNew = true;
  }

  // Skip the reminder if we just told the user about new payments.
  if (canNotify && settings.dailyReminder && !notifiedNew) {
    const now = new Date();
    const pending = await countPending();
    const lastSentDay = await getLastReminderDay();
    if (shouldSendReminder({ now, hour: settings.reminderHour, lastSentDay, pending })) {
      await showNotification(reminderMessage(pending, settings.hideDetails));
      await setLastReminderDay(todayKey(now));
      reminded = true;
    }
  }

  return { signedIn: true, summary, notifiedNew, reminded };
}

import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotifySettings = {
  newPayments: boolean;
  dailyReminder: boolean;
  reminderHour: number;
  /** Lock-screen text shows only a count, never amounts or payees. */
  hideDetails: boolean;
};

export const DEFAULT_SETTINGS: NotifySettings = { newPayments: true, dailyReminder: false, reminderHour: 21, hideDetails: true };

const KEY = 'ledgerly:notifySettings';
const LAST_REMINDER_KEY = 'ledgerly:lastReminderDay';

export async function loadSettings(): Promise<NotifySettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<NotifySettings>) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: NotifySettings): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(settings)).catch(() => undefined);
}

export const getLastReminderDay = () => AsyncStorage.getItem(LAST_REMINDER_KEY).catch(() => null);
export const setLastReminderDay = (day: string) => AsyncStorage.setItem(LAST_REMINDER_KEY, day).catch(() => undefined);

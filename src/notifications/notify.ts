import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Message } from './messages';

const CHANNEL_ID = 'payments';

// Show notifications even while the app is open (banner and in the notification list).
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Payments',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function hasNotificationPermission(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).granted;
}

/** Asks Android for notification permission (Android 13+ shows a system dialog). */
export async function requestNotificationPermission(): Promise<boolean> {
  await ensureChannel();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Shows a notification right now. Tapping it opens the Inbox. */
export async function showNotification(message: Message): Promise<void> {
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    content: { title: message.title, body: message.body, data: { screen: 'inbox' } },
    trigger: Platform.OS === 'android' ? { channelId: CHANNEL_ID } : null,
  });
}

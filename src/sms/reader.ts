import { PermissionsAndroid, Platform } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import type { RawSms } from '../parser';

export async function requestSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS, {
    title: 'Read your SMS',
    message: 'Expensefy reads bank and UPI SMS on this phone to create your transactions. SMS never leave your device.',
    buttonPositive: 'Allow',
    buttonNegative: 'Not now',
  });
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

type NativeSms = { address?: string; body?: string; date?: string | number };

/** Reads inbox messages received in the last `days` days (newest first). */
export function readInbox({ days = 30, maxCount = 1000 } = {}): Promise<RawSms[]> {
  const filter = { box: 'inbox', maxCount, minDate: Date.now() - days * 24 * 60 * 60 * 1000 };
  return new Promise((resolve, reject) => {
    SmsAndroid.list(
      JSON.stringify(filter),
      (error) => reject(new Error(error)),
      (_count, json) => {
        const rows = JSON.parse(json) as NativeSms[];
        resolve(
          rows
            .filter((r) => typeof r.body === 'string' && r.body.length > 0)
            .map((r) => ({ body: r.body as string, address: r.address, date: Number(r.date) })),
        );
      },
    );
  });
}

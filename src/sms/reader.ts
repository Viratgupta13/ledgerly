import { PermissionsAndroid, Platform } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import { demoInbox } from '../demo/db';
import type { RawSms } from '../parser';
import { isDemo } from '../store/auth';

export async function hasSmsPermission(): Promise<boolean> {
  if (isDemo()) return true;
  return Platform.OS === 'android' && (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS));
}

export async function requestSmsPermission(): Promise<boolean> {
  if (isDemo()) return true;
  if (Platform.OS !== 'android') return false;
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS, {
    title: 'Read your SMS',
    message: 'Ledgerly reads bank and UPI SMS on this phone to create your transactions. SMS never leave your device.',
    buttonPositive: 'Allow',
    buttonNegative: 'Not now',
  });
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

type NativeSms = { address?: string; body?: string; date?: string | number };

/** Reads inbox messages received in the last `days` days (newest first). */
export function readInbox({ days = 30 }: { days?: number } = {}): Promise<RawSms[]> {
  if (isDemo()) return Promise.resolve(demoInbox());
  const maxCount = days > 90 ? 5000 : 1000;
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

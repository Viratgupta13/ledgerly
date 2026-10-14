import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyPredefined, importParsed, type NewPayment } from '../data/api';
import { parseSms, type ParsedTxn, type RawSms } from '../parser';
import { hasSmsPermission, readInbox, requestSmsPermission } from './reader';

const LAST_SCAN_KEY = 'ledgerly:lastScanAt';
const DAY_MS = 24 * 60 * 60 * 1000;

export type ScanSummary = { scanned: number; found: number; added: number; payments: NewPayment[] };

/** Reads the last `days` days of SMS, parses them and saves new ones. Returns null if SMS access is missing. */
export async function scanAndImport(
  userId: string,
  days: number,
  { askPermission }: { askPermission: boolean },
): Promise<ScanSummary | null> {
  const allowed = askPermission ? await requestSmsPermission() : await hasSmsPermission();
  if (!allowed) {
    if (askPermission) throw new Error('SMS permission was not granted.');
    return null;
  }

  const messages = await readInbox({ days });
  const items: { sms: RawSms; txn: ParsedTxn }[] = [];
  for (const sms of messages) {
    const result = parseSms(sms);
    if (result.ok) items.push({ sms, txn: result.txn });
  }
  const { added, payments } = await importParsed(userId, items);
  await applyPredefined();
  await AsyncStorage.setItem(LAST_SCAN_KEY, String(Date.now())).catch(() => undefined);
  return { scanned: messages.length, found: items.length, added, payments };
}

/**
 * Silent scan for messages that arrived since the last scan. Does nothing until the user has
 * granted SMS access and done a first manual scan.
 */
export async function autoScan(userId: string): Promise<ScanSummary | null> {
  const last = Number(await AsyncStorage.getItem(LAST_SCAN_KEY).catch(() => null));
  if (!last) return null;
  const days = Math.min(365, Math.max(2, Math.ceil((Date.now() - last) / DAY_MS) + 1));
  return scanAndImport(userId, days, { askPermission: false });
}

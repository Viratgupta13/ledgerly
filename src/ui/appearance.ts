import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';

const KEY = 'ledgerly:themeMode';

export async function loadThemeMode(): Promise<ThemeMode> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

/** Applies the mode app-wide. 'system' hands control back to the phone's setting. */
export function applyThemeMode(mode: ThemeMode): void {
  Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
}

export async function saveThemeMode(mode: ThemeMode): Promise<void> {
  applyThemeMode(mode);
  await AsyncStorage.setItem(KEY, mode).catch(() => undefined);
}

import { Appearance } from 'react-native';

/** The app is light-only for now: pin the colour scheme regardless of the phone's dark mode. */
export function lockLightMode(): void {
  Appearance.setColorScheme('light');
}

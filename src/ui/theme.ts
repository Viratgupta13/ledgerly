import type { ComponentProps } from 'react';
import type { MaterialIcons } from '@expo/vector-icons';

export type IconName = ComponentProps<typeof MaterialIcons>['name'];

type Meta = { color: string; icon: IconName; iconColor: string };

/**
 * Category colours exactly as the Home screen of the design uses them:
 * Food = primary, Transport = primary-container, Shopping = secondary, Rent = tertiary-container,
 * Bills = outline. The tile is the colour at 10% opacity with the icon in the colour.
 */
const KNOWN: Record<string, Meta> = {
  food: { color: '#3525cd', icon: 'restaurant', iconColor: '#3525cd' },
  transport: { color: '#4f46e5', icon: 'directions-car', iconColor: '#4f46e5' },
  shopping: { color: '#006c49', icon: 'shopping-bag', iconColor: '#006c49' },
  rent: { color: '#c20038', icon: 'home', iconColor: '#c20038' },
  bills: { color: '#777587', icon: 'receipt', iconColor: '#131b2e' },
  friends: { color: '#4edea3', icon: 'groups', iconColor: '#006c49' },
  essential: { color: '#EAB308', icon: 'shopping-cart', iconColor: '#a16207' },
  other: { color: '#777587', icon: 'category', iconColor: '#131b2e' },
  uncategorised: { color: '#777587', icon: 'help-outline', iconColor: '#131b2e' },
};

const FALLBACK = ['#950029', '#4edea3', '#ffb3b6', '#8083ff', '#a16207', '#0e7490'];

/** Colour and icon for a category. User-made categories get a stable colour and a tag icon. */
export function categoryMeta(name: string | null | undefined): Meta {
  const key = (name ?? '').trim().toLowerCase();
  if (KNOWN[key]) return KNOWN[key];
  if (!key) return KNOWN.uncategorised;
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const color = FALLBACK[h % FALLBACK.length];
  return { color, icon: 'label', iconColor: color };
}

export const categoryColor = (name: string) => categoryMeta(name).color;

/** "#F97316" -> "rgba(249,115,22,0.12)", for the tinted icon tiles. */
export function tint(hex: string, alpha = 0.12): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

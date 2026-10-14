import type { ComponentProps } from 'react';
import type { MaterialIcons } from '@expo/vector-icons';

export type IconName = ComponentProps<typeof MaterialIcons>['name'];

type Meta = { color: string; icon: IconName };

/** Design tokens from the Stitch "Calm Precision Fintech" system. */
const KNOWN: Record<string, Meta> = {
  food: { color: '#F97316', icon: 'restaurant' },
  transport: { color: '#06B6D4', icon: 'directions-car' },
  shopping: { color: '#EC4899', icon: 'shopping-bag' },
  bills: { color: '#8B5CF6', icon: 'receipt' },
  rent: { color: '#3B82F6', icon: 'home' },
  friends: { color: '#10B981', icon: 'groups' },
  essential: { color: '#EAB308', icon: 'shopping-cart' },
  other: { color: '#64748B', icon: 'category' },
  uncategorised: { color: '#64748B', icon: 'help-outline' },
};

const FALLBACK = ['#6366f1', '#14b8a6', '#f43f5e', '#84cc16', '#a855f7', '#0ea5e9'];

/** Colour and icon for a category. User-made categories get a stable colour and a tag icon. */
export function categoryMeta(name: string | null | undefined): Meta {
  const key = (name ?? '').trim().toLowerCase();
  if (KNOWN[key]) return KNOWN[key];
  if (!key) return KNOWN.uncategorised;
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return { color: FALLBACK[h % FALLBACK.length], icon: 'label' };
}

export const categoryColor = (name: string) => categoryMeta(name).color;

/** "#F97316" -> "rgba(249,115,22,0.12)", for the tinted icon tiles. */
export function tint(hex: string, alpha = 0.12): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

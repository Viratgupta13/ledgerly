import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text as RNText,
  TextInput,
  View,
  type TextInputProps,
  type TextProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/auth';
import { categoryMeta, tint } from './theme';

export const INK = 'text-slate-900 dark:text-slate-50';
export const MUTED = 'text-slate-500 dark:text-slate-400';
export const ink = INK;
export const muted = MUTED;

const withFont = (className = '') => (className.includes('font-inter') ? className : `font-inter ${className}`);

/** Text that defaults to Inter. Use `font-inter-md|sb|b` for heavier weights. */
export function Text({ className, ...props }: TextProps & { className?: string }) {
  return <RNText {...props} className={withFont(className)} />;
}

export const rupees = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <View className={`rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {children}
    </View>
  );
}

/** Initials of the signed-in user's email, used for the profile avatar. */
export function useInitials(): string {
  const email = useAuthStore((s) => s.session?.user.email) ?? '';
  const name = email.split('@')[0].replace(/[^a-zA-Z]+/g, ' ').trim();
  const parts = name.split(' ').filter(Boolean);
  return ((parts[0]?.[0] ?? 'E') + (parts[1]?.[0] ?? '')).toUpperCase();
}

/** Top bar: logo tile, wordmark and the profile avatar (opens Settings). */
export function AppHeader() {
  const router = useRouter();
  const initials = useInitials();
  return (
    <View className="h-14 flex-row items-center justify-between">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
          <Text className="font-inter-b text-lg text-white">E</Text>
        </View>
        <Text className={`font-inter-sb text-xl ${INK}`}>Expensefy</Text>
      </View>
      <Pressable
        onPress={() => router.push('/settings')}
        hitSlop={8}
        className="h-10 w-10 items-center justify-center rounded-full bg-indigo-600 active:opacity-70"
      >
        <Text className="font-inter-sb text-sm text-white">{initials}</Text>
      </Pressable>
    </View>
  );
}

/** Page wrapper: safe area, app header and an optional large page title. */
export function Screen({
  title,
  subtitle,
  right,
  header = true,
  children,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  header?: boolean;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-slate-50 px-4 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      {header && <AppHeader />}
      {title ? (
        <View className="mb-3 mt-2 flex-row items-end justify-between">
          <View className="flex-1 pr-3">
            <Text className={`font-inter-b text-3xl ${INK}`}>{title}</Text>
            {subtitle ? <Text className={`mt-0.5 ${MUTED}`}>{subtitle}</Text> : null}
          </View>
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'soft';
  loading?: boolean;
  disabled?: boolean;
  icon?: ComponentProps<typeof Ionicons>['name'];
  iconRight?: ComponentProps<typeof Ionicons>['name'];
  className?: string;
};

const BUTTON = {
  primary: { box: 'bg-indigo-600', text: 'text-white', icon: '#ffffff' },
  secondary: { box: 'border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900', text: INK, icon: '#4f46e5' },
  soft: { box: 'bg-indigo-50 dark:bg-slate-800', text: 'text-indigo-700 dark:text-indigo-300', icon: '#4f46e5' },
  danger: { box: 'bg-rose-50 dark:bg-rose-950', text: 'text-rose-600', icon: '#e11d48' },
} as const;

/** 52px tall, 14px radius, dims while pressed so every tap visibly registers. */
export function Button({ label, onPress, variant = 'primary', loading, disabled, icon, iconRight, className = '' }: ButtonProps) {
  const v = BUTTON[variant];
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      hitSlop={6}
      className={`min-h-[52px] flex-row items-center justify-center gap-2 rounded-[14px] px-4 active:opacity-60 ${v.box} ${off ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? <ActivityIndicator color={v.icon} /> : icon ? <Ionicons name={icon} size={18} color={v.icon} /> : null}
      <Text className={`font-inter-sb text-base ${v.text}`}>{label}</Text>
      {iconRight && !loading ? <Ionicons name={iconRight} size={18} color={v.icon} /> : null}
    </Pressable>
  );
}

/** Small text-only action with a generous touch area. */
export function LinkButton({ label, onPress, tone = 'brand' }: { label: string; onPress: () => void; tone?: 'brand' | 'danger' }) {
  return (
    <Pressable onPress={onPress} hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }} className="min-h-9 justify-center active:opacity-50">
      <Text className={`font-inter-md text-sm ${tone === 'danger' ? 'text-rose-600' : 'text-indigo-600 dark:text-indigo-400'}`}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  dashed,
  dot,
  check,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  dashed?: boolean;
  dot?: string;
  check?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      className={`min-h-10 flex-row items-center gap-2 rounded-full border px-4 active:opacity-60 ${
        selected
          ? 'border-indigo-600 bg-indigo-600'
          : `${dashed ? 'border-dashed' : ''} border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900`
      }`}
    >
      {selected && check ? <Ionicons name="checkmark" size={14} color="#fff" /> : dot ? <View className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} /> : null}
      <Text className={selected ? 'font-inter-md text-white' : `font-inter-md ${INK}`}>{label}</Text>
    </Pressable>
  );
}

/** Text field, 52px tall, with an optional leading icon and trailing element. */
export function Input({
  icon,
  right,
  label,
  className = '',
  ...props
}: TextInputProps & { icon?: ComponentProps<typeof Ionicons>['name']; right?: ReactNode; label?: string; className?: string }) {
  return (
    <View>
      {label ? <Text className={`mb-1.5 font-inter-md text-sm ${INK}`}>{label}</Text> : null}
      <View className={`min-h-[52px] flex-row items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900 ${className}`}>
        {icon ? <Ionicons name={icon} size={20} color="#64748b" /> : null}
        <TextInput placeholderTextColor="#94a3b8" {...props} className={`font-inter flex-1 py-3 text-base ${INK}`} />
        {right}
      </View>
    </View>
  );
}

export function Amount({ value, type, className = '' }: { value: number; type: 'debit' | 'credit'; className?: string }) {
  return (
    <Text
      style={{ fontVariant: ['tabular-nums'] }}
      className={`font-inter-sb ${type === 'debit' ? INK : 'text-emerald-600 dark:text-emerald-400'} ${className}`}
    >
      {type === 'debit' ? '-' : '+'}{rupees(value)}
    </Text>
  );
}

/** 40px rounded tile tinted with the category colour and holding its icon. */
export function CategoryTile({ category, size = 40 }: { category: string | null | undefined; size?: number }) {
  const meta = categoryMeta(category);
  return (
    <View className="items-center justify-center rounded-[10px]" style={{ width: size, height: size, backgroundColor: tint(meta.color) }}>
      <MaterialIcons name={meta.icon} size={size * 0.5} color={meta.color} />
    </View>
  );
}

export function Pill({ label, tone = 'brand' }: { label: string; tone?: 'brand' | 'rose' | 'emerald' | 'amber' | 'slate' }) {
  const tones = {
    brand: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  } as const;
  const [bg, fg, dbg, dfg] = tones[tone].split(' ');
  return (
    <View className={`self-start rounded-full px-2.5 py-0.5 ${bg} ${dbg}`}>
      <Text className={`font-inter-md text-xs ${fg} ${dfg}`}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ share, color }: { share: number; color: string }) {
  return (
    <View className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <View className="h-1.5 rounded-full" style={{ width: `${Math.min(1, Math.max(0, share)) * 100}%`, backgroundColor: color }} />
    </View>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text className={`font-inter-sb text-xs uppercase tracking-wider ${MUTED}`}>{children}</Text>;
}

export function Empty({ icon, title, hint }: { icon: ComponentProps<typeof Ionicons>['name']; title: string; hint?: string }) {
  return (
    <View className="items-center px-6 py-12">
      <Ionicons name={icon} size={40} color="#94a3b8" />
      <Text className={`mt-3 font-inter-sb text-base ${INK}`}>{title}</Text>
      {hint ? <Text className={`mt-1 text-center ${MUTED}`}>{hint}</Text> : null}
    </View>
  );
}

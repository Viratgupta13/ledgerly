import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const INK = 'text-slate-900 dark:text-slate-50';
const MUTED = 'text-slate-500 dark:text-slate-400';

export const rupees = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Page wrapper: background, status-bar safe area and a large title. */
export function Screen({ title, subtitle, right, children }: { title: string; subtitle?: string; right?: ReactNode; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-slate-50 px-4 dark:bg-slate-950" style={{ paddingTop: insets.top + 12 }}>
      <View className="mb-3 flex-row items-end justify-between">
        <View className="flex-1">
          <Text className={`text-3xl font-bold ${INK}`}>{title}</Text>
          {subtitle ? <Text className={`mt-0.5 ${MUTED}`}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <View className={`rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {children}
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  className?: string;
};

const BUTTON: Record<NonNullable<ButtonProps['variant']>, { box: string; text: string; icon: string }> = {
  primary: { box: 'bg-indigo-600', text: 'text-white', icon: '#ffffff' },
  secondary: { box: 'border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900', text: INK, icon: '#6366f1' },
  danger: { box: 'bg-rose-600', text: 'text-white', icon: '#ffffff' },
};

/** 48px tall, dims while pressed so every tap visibly registers. */
export function Button({ label, onPress, variant = 'primary', loading, disabled, icon, className = '' }: ButtonProps) {
  const v = BUTTON[variant];
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      hitSlop={6}
      className={`min-h-12 flex-row items-center justify-center gap-2 rounded-xl px-4 active:opacity-60 ${v.box} ${off ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? <ActivityIndicator color={v.icon} /> : icon ? <Ionicons name={icon} size={18} color={v.icon} /> : null}
      <Text className={`font-semibold ${v.text}`}>{label}</Text>
    </Pressable>
  );
}

/** Small text-only action with a generous touch area. */
export function LinkButton({ label, onPress, tone = 'brand' }: { label: string; onPress: () => void; tone?: 'brand' | 'danger' }) {
  return (
    <Pressable onPress={onPress} hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }} className="min-h-9 justify-center active:opacity-50">
      <Text className={`text-sm font-medium ${tone === 'danger' ? 'text-rose-600' : 'text-indigo-600 dark:text-indigo-400'}`}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress, dashed, dot }: { label: string; selected?: boolean; onPress: () => void; dashed?: boolean; dot?: string }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      className={`min-h-10 flex-row items-center gap-2 rounded-full border px-4 active:opacity-60 ${
        selected
          ? 'border-indigo-600 bg-indigo-600'
          : `${dashed ? 'border-dashed' : ''} border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900`
      }`}
    >
      {dot ? <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dot }} /> : null}
      <Text className={selected ? 'font-medium text-white' : `font-medium ${INK}`}>{label}</Text>
    </Pressable>
  );
}

export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor="#94a3b8"
      {...props}
      className={`min-h-12 rounded-xl border border-slate-300 bg-white px-4 text-base dark:border-slate-700 dark:bg-slate-900 ${INK} ${props.className ?? ''}`}
    />
  );
}

export function Amount({ value, type, className = '' }: { value: number; type: 'debit' | 'credit'; className?: string }) {
  return (
    <Text className={`font-semibold ${type === 'debit' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'} ${className}`}>
      {type === 'debit' ? '-' : '+'}{rupees(value)}
    </Text>
  );
}

export function Empty({ icon, title, hint }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; hint?: string }) {
  return (
    <View className="items-center px-6 py-12">
      <Ionicons name={icon} size={40} color="#94a3b8" />
      <Text className={`mt-3 text-base font-semibold ${INK}`}>{title}</Text>
      {hint ? <Text className={`mt-1 text-center ${MUTED}`}>{hint}</Text> : null}
    </View>
  );
}

export const ink = INK;
export const muted = MUTED;

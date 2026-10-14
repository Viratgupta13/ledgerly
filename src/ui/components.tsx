import { MaterialIcons } from '@expo/vector-icons';
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
import { useRef } from 'react';
import { useAuthStore } from '../store/auth';
import { categoryMeta, tint } from './theme';

export type IconName = ComponentProps<typeof MaterialIcons>['name'];

export const INK = 'text-on-surface';
export const MUTED = 'text-on-surface-variant';
export const ink = INK;
export const muted = MUTED;

const withFont = (className = '') => (className.includes('font-inter') ? className : `font-inter ${className}`);

/** Text that defaults to Inter. Use `font-inter-md|sb|b` for heavier weights. */
export function Text({ className, ...props }: TextProps & { className?: string }) {
  return <RNText {...props} className={withFont(className)} />;
}

export function Icon({ name, size = 20, color = '#131b2e' }: { name: IconName; size?: number; color?: string }) {
  return <MaterialIcons name={name} size={size} color={color} />;
}

export const rupees = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const SHADOW_SM = { shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 } as const;
const SHADOW_MD = { shadowColor: '#3525cd', shadowOpacity: 0.22, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 } as const;

/** White surface, 16px radius, soft shadow, no border. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <View style={SHADOW_SM} className={`rounded-2xl bg-surface-container-lowest ${className}`}>
      {children}
    </View>
  );
}

/** Profile avatar: a 32px primary circle with a person glyph (opens Settings). */
export function Avatar({ onPress }: { onPress?: () => void }) {
  const router = useRouter();
  return (
    <Pressable onPress={onPress ?? (() => router.push('/settings'))} hitSlop={4} className="h-12 w-12 items-center justify-center rounded-full active:opacity-60">
      <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
        <Icon name="person" size={18} color="#ffffff" />
      </View>
    </Pressable>
  );
}

/** Top bar: 36px "E" tile, bold title and the profile avatar. */
export function AppHeader({ title = 'Ledgerly' }: { title?: string }) {
  return (
    <View style={{ shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 1 }, elevation: 1 }} className="h-16 flex-row items-center justify-between bg-surface px-4">
      <View className="flex-row items-center gap-2">
        <View style={SHADOW_SM} className="h-9 w-9 items-center justify-center rounded-xl bg-primary">
          <Text className="font-inter-b text-headline-sm text-on-primary">₹</Text>
        </View>
        <Text className={`font-inter-b text-headline-sm ${INK}`}>{title}</Text>
      </View>
      <Avatar />
    </View>
  );
}

/** Page wrapper: safe area, app header, 16px side margins and an optional page title. */
export function Screen({
  title,
  subtitle,
  right,
  headerTitle,
  header = true,
  children,
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  headerTitle?: string;
  header?: boolean;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {header && <AppHeader title={headerTitle} />}
      <View className="flex-1 px-4">
        {title ? (
          <View className="mb-4 mt-4 flex-row items-end justify-between">
            <View className="flex-1 pr-3">
              <Text className={`font-inter-sb text-headline-lg ${INK}`}>{title}</Text>
              {subtitle ? <Text className={`mt-0.5 text-body-md ${MUTED}`}>{subtitle}</Text> : null}
            </View>
            {right}
          </View>
        ) : (
          <View className="h-2" />
        )}
        {children}
      </View>
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'soft' | 'success';
  size?: 'lg' | 'md' | 'sm';
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  iconRight?: IconName;
  className?: string;
};

const BUTTON = {
  primary: { box: 'bg-primary', text: 'text-on-primary', icon: '#ffffff' },
  success: { box: 'bg-secondary', text: 'text-on-secondary', icon: '#ffffff' },
  secondary: { box: 'bg-surface-container-high', text: INK, icon: '#131b2e' },
  soft: { box: 'bg-surface-container', text: 'text-primary', icon: '#3525cd' },
  danger: { box: 'bg-error-container', text: 'text-error', icon: '#ba1a1a' },
} as const;
const HEIGHT = { lg: 'h-[52px]', md: 'h-12', sm: 'h-11' } as const;

/** Rounded-xl button (52 / 48 / 44px). Primary buttons carry the soft indigo shadow. */
export function Button({ label, onPress, variant = 'primary', size = 'md', loading, disabled, icon, iconRight, className = '' }: ButtonProps) {
  const v = BUTTON[variant];
  const off = disabled || loading;
  const color = variant === 'secondary' ? (disabled ? '#777587' : '#131b2e') : v.icon;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      hitSlop={4}
      style={variant === 'primary' || variant === 'success' ? SHADOW_MD : undefined}
      className={`${HEIGHT[size]} flex-row items-center justify-center gap-2 rounded-xl px-4 active:opacity-70 ${v.box} ${off ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? <ActivityIndicator color={color} /> : icon ? <Icon name={icon} size={size === 'lg' || size === 'md' ? 20 : 18} color={color} /> : null}
      <Text className={`font-inter-sb text-label-lg ${v.text}`}>{label}</Text>
      {iconRight && !loading ? <Icon name={iconRight} size={18} color={color} /> : null}
    </Pressable>
  );
}

/** Small text-only action with a generous touch area. */
export function LinkButton({ label, onPress, tone = 'brand' }: { label: string; onPress: () => void; tone?: 'brand' | 'danger' }) {
  return (
    <Pressable onPress={onPress} hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }} className="min-h-9 justify-center active:opacity-50">
      <Text className={`font-inter-md text-label-lg ${tone === 'danger' ? 'text-error' : 'text-primary'}`}>{label}</Text>
    </Pressable>
  );
}

/**
 * Pill chip, 36px tall. `tone="range"` is the grey scan-range chip; `tone="category"` is the
 * lighter chip with a colour dot used when picking a category.
 */
export function Chip({
  label,
  selected,
  onPress,
  dashed,
  dot,
  check,
  tone = 'range',
  small,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
  dashed?: boolean;
  dot?: string;
  check?: boolean;
  tone?: 'range' | 'category';
  small?: boolean;
}) {
  const idle = tone === 'category' ? 'bg-surface-container-low' : 'bg-surface-container';
  return (
    <Pressable
      onPress={onPress}
      hitSlop={small ? 6 : 4}
      style={selected ? SHADOW_SM : undefined}
      className={`${small ? 'h-7 px-2.5' : 'h-9 px-4'} flex-row items-center gap-1.5 rounded-full active:opacity-60 ${
        selected ? 'bg-primary' : `${dashed ? 'border border-dashed border-outline-variant' : ''} ${idle}`
      }`}
    >
      {selected && check ? <Icon name="check" size={16} color="#ffffff" /> : null}
      {dot ? <View className="h-2 w-2 rounded-full" style={{ backgroundColor: selected ? '#6cf8bb' : dot }} /> : null}
      <Text className={`font-inter-md ${small ? 'text-label-sm' : 'text-label-md'} ${selected ? 'text-on-primary' : tone === 'category' ? INK : MUTED}`}>{label}</Text>
    </Pressable>
  );
}

/** "+ New" chip: lavender with a primary plus. */
export function NewChip({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={4} className="h-9 flex-row items-center gap-1 rounded-full bg-surface-container px-3 active:opacity-60">
      <Icon name="add" size={16} color="#3525cd" />
      <Text className="font-inter-md text-label-md text-primary">New</Text>
    </Pressable>
  );
}

/**
 * Text field. `variant="auth"` is the white, shadowed 52px field of the sign-in screens;
 * `variant="field"` is the lavender 48px field used inside cards.
 */
export function Input({
  icon,
  right,
  label,
  variant = 'auth',
  className = '',
  ...props
}: TextInputProps & { icon?: IconName; right?: ReactNode; label?: string; variant?: 'auth' | 'field'; className?: string }) {
  const auth = variant === 'auth';
  return (
    <View>
      {label ? <Text className={`mb-1.5 font-inter-md text-label-lg ${INK}`}>{label}</Text> : null}
      <View
        style={auth ? SHADOW_SM : undefined}
        className={`${auth ? 'h-[52px] bg-surface-container-lowest' : 'h-12 bg-surface-container-low'} flex-row items-center gap-3 rounded-xl px-3 ${className}`}
      >
        {icon ? <Icon name={icon} size={20} color={auth ? '#464555' : '#c7c4d8'} /> : null}
        <TextInput placeholderTextColor="#777587" {...props} className={`font-inter flex-1 py-0 text-body-lg ${INK}`} />
        {right}
      </View>
    </View>
  );
}

/** Material-3 switch: 48x32 track, 24px thumb with a check when on. */
export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable onPress={() => onChange(!value)} hitSlop={10} className={`h-8 w-12 justify-center rounded-full p-1 ${value ? 'bg-primary' : 'bg-surface-container-highest'}`}>
      <View style={SHADOW_SM} className={`h-6 w-6 items-center justify-center rounded-full ${value ? 'self-end bg-on-primary' : 'self-start bg-surface-container-lowest'}`}>
        {value ? <Icon name="check" size={14} color="#3525cd" /> : null}
      </View>
    </Pressable>
  );
}

/** Debit amounts are tertiary crimson in lists; `plain` uses on-surface; credits are secondary green. */
export function Amount({ value, type, plain, className = '' }: { value: number; type: 'debit' | 'credit'; plain?: boolean; className?: string }) {
  const tone = type === 'credit' ? 'text-secondary' : plain ? INK : 'text-tertiary';
  return (
    <Text style={{ fontVariant: ['tabular-nums'] }} className={`font-inter-b text-title-md ${tone} ${className}`}>
      {type === 'debit' ? '-' : '+'}{rupees(value)}
    </Text>
  );
}

/** Rounded-xl tile tinted with the category colour (10%) and holding its icon. */
export function CategoryTile({ category, size = 40 }: { category: string | null | undefined; size?: number }) {
  const meta = categoryMeta(category);
  return (
    <View className="items-center justify-center rounded-xl" style={{ width: size, height: size, backgroundColor: tint(meta.color, 0.1) }}>
      <Icon name={meta.icon} size={22} color={meta.iconColor} />
    </View>
  );
}

const PILL = {
  brand: ['bg-primary-fixed', 'text-on-primary-fixed'],
  rose: ['bg-error-container', 'text-on-error-container'],
  tertiary: ['bg-tertiary-fixed', 'text-on-tertiary-fixed'],
  emerald: ['bg-secondary-container', 'text-on-secondary-container'],
  success: ['bg-secondary-fixed', 'text-on-secondary-fixed-variant'],
  slate: ['bg-surface-container', 'text-on-surface-variant'],
  highest: ['bg-surface-container-highest', 'text-on-surface-variant'],
} as const;

export function Pill({ label, tone = 'brand', icon, className = '' }: { label: string; tone?: keyof typeof PILL; icon?: IconName; className?: string }) {
  const [box, fg] = PILL[tone];
  const iconColor = tone === 'rose' ? '#93000a' : tone === 'tertiary' ? '#40000c' : '#3525cd';
  return (
    <View className={`flex-row items-center gap-1 self-start rounded-full px-2.5 py-1 ${box} ${className}`}>
      {icon ? <Icon name={icon} size={14} color={iconColor} /> : null}
      <Text className={`font-inter-md text-label-md ${fg}`}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ share, color, height = 4 }: { share: number; color: string; height?: number }) {
  return (
    <View className="overflow-hidden rounded-full bg-surface-container" style={{ height }}>
      <View className="rounded-full" style={{ height, width: `${Math.min(1, Math.max(0, share)) * 100}%`, backgroundColor: color }} />
    </View>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <Text className={`font-inter-b text-label-sm uppercase tracking-wider ${MUTED}`}>{children}</Text>;
}

export function Empty({ icon, title, hint }: { icon: IconName; title: string; hint?: string }) {
  return (
    <View className="items-center rounded-3xl bg-surface-container-lowest px-6 py-10" style={SHADOW_SM}>
      <View className="h-20 w-20 items-center justify-center rounded-full bg-surface-container">
        <Icon name={icon} size={44} color="#4f46e5" />
      </View>
      <Text className={`mt-4 font-inter-b text-headline-sm ${INK}`}>{title}</Text>
      {hint ? <Text className={`mt-1 text-center text-body-md ${MUTED}`}>{hint}</Text> : null}
    </View>
  );
}

/** Initials of the signed-in user's email, used for the profile avatar in Settings. */
export function useInitials(): string {
  const email = useAuthStore((s) => s.session?.user.email) ?? '';
  const parts = email.split('@')[0].replace(/[^a-zA-Z]+/g, ' ').trim().split(' ').filter(Boolean);
  return ((parts[0]?.[0] ?? 'E') + (parts[1]?.[0] ?? '')).toUpperCase();
}

/** Boxes for a one-time code; one hidden numeric input does the typing. */
export function CodeInput({ value, onChange, length = 6 }: { value: string; onChange: (v: string) => void; length?: number }) {
  const ref = useRef<TextInput>(null);
  return (
    <Pressable onPress={() => ref.current?.focus()}>
      <View className="flex-row gap-1.5">
        {Array.from({ length }).map((_, i) => (
          <View
            key={i}
            style={SHADOW_SM}
            className={`h-14 flex-1 items-center justify-center rounded-lg bg-surface-container-lowest ${value.length === i ? 'border-2 border-primary' : ''}`}
          >
            <Text className={`font-inter-b text-headline-sm ${INK}`}>{value[i] ?? ''}</Text>
          </View>
        ))}
      </View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
      />
    </Pressable>
  );
}

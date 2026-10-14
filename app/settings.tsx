import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { checkForNewPayments } from '../src/background/check';
import { syncBackgroundTask } from '../src/background/task';
import { supabase } from '../src/lib/supabase';
import { requestNotificationPermission, showNotification } from '../src/notifications/notify';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type NotifySettings } from '../src/notifications/settings';
import { hasSmsPermission } from '../src/sms/reader';
import { useAuthStore } from '../src/store/auth';
import { loadThemeMode, saveThemeMode, type ThemeMode } from '../src/ui/appearance';
import { Icon, SHADOW_SM, Text, Toggle, ink, muted, useInitials, type IconName } from '../src/ui/components';

const HOURS = [
  { label: '9 am', hour: 9 },
  { label: '1 pm', hour: 13 },
  { label: '6 pm', hour: 18 },
  { label: '9 pm', hour: 21 },
];

function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between px-1 pb-1">
      <Text className={`font-inter-sb text-label-md uppercase tracking-wider ${muted}`}>{children}</Text>
      {right}
    </View>
  );
}

/** White card whose rows are divided by a hairline, like the design's grouped lists. */
function Group({ children }: { children: ReactNode }) {
  const rows = Array.isArray(children) ? children : [children];
  return (
    <View style={SHADOW_SM} className="overflow-hidden rounded-xl bg-surface-container-lowest dark:bg-dk-lowest">
      {rows.filter(Boolean).map((c, i) => (
        <View key={i} className={i > 0 ? 'border-t border-surface-container dark:border-dk-container' : ''}>{c}</View>
      ))}
    </View>
  );
}

function Row({ icon, tint = 'muted', title, sub, right, onPress, children }: { icon: IconName; tint?: 'brand' | 'muted'; title: string; sub?: string; right?: ReactNode; onPress?: () => void; children?: ReactNode }) {
  return (
    <View>
      <Pressable disabled={!onPress} onPress={onPress} className="min-h-14 flex-row items-center justify-between gap-2 p-4 active:bg-surface-container-low">
        <View className="flex-1 flex-row items-center gap-4">
          <View className={`h-10 w-10 items-center justify-center rounded-lg ${tint === 'brand' ? 'bg-primary-fixed dark:bg-dk-container' : 'bg-surface-container dark:bg-dk-container'}`}>
            <Icon name={icon} size={20} color={tint === 'brand' ? '#0f0069' : '#464555'} />
          </View>
          <View className="flex-1">
            <Text className={`font-inter-sb text-title-md ${ink}`}>{title}</Text>
            {sub ? <Text className={`text-body-sm ${muted}`}>{sub}</Text> : null}
          </View>
        </View>
        {right}
      </Pressable>
      {children}
    </View>
  );
}

function Segmented<T extends string | number>({ options, value, onChange }: { options: { label: string; value: T }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View className="flex-row rounded-full bg-surface-container p-1 dark:bg-dk-container">
      {options.map((o) => (
        <Pressable key={String(o.value)} onPress={() => onChange(o.value)} className={`rounded-full px-3 py-1.5 ${o.value === value ? 'bg-primary' : ''}`}>
          <Text className={`font-inter-sb text-label-sm ${o.value === value ? 'text-on-primary' : muted}`}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const email = useAuthStore((s) => s.session?.user.email);
  const initials = useInitials();
  const [settings, setSettings] = useState<NotifySettings>(DEFAULT_SETTINGS);
  const [smsAllowed, setSmsAllowed] = useState<boolean | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('system');

  useEffect(() => {
    loadSettings().then(setSettings);
    hasSmsPermission().then(setSmsAllowed);
    loadThemeMode().then(setTheme);
  }, []);

  const update = async (patch: Partial<NotifySettings>) => {
    const next = { ...settings, ...patch };
    // Turning a notification on needs the Android permission first.
    if ((patch.newPayments || patch.dailyReminder) && !(await requestNotificationPermission())) {
      Alert.alert('Notifications are off', 'Allow notifications for Expensefy in your phone settings to turn this on.');
      return;
    }
    setSettings(next);
    await saveSettings(next);
    await syncBackgroundTask(next).catch(() => undefined);
  };

  const checkNow = async () => {
    setChecking(true);
    setStatus(null);
    try {
      const r = await checkForNewPayments();
      if (!r.signedIn) setStatus('Not signed in.');
      else if (!r.summary) setStatus('Do a first scan in the Inbox tab (and allow SMS access) before automatic checks can run.');
      else setStatus(r.summary.added > 0 ? `Found ${r.summary.added} new payments${r.notifiedNew ? ' and sent a notification.' : '.'}` : 'No new payments found.');
      qc.invalidateQueries({ queryKey: ['txns'] });
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Check failed.');
    } finally {
      setChecking(false);
    }
  };

  const testNotification = async () => {
    if (!(await requestNotificationPermission())) {
      Alert.alert('Notifications are off', 'Allow notifications for Expensefy in your phone settings.');
      return;
    }
    await showNotification({ title: 'Notifications are working', body: 'You will see new payments here.' });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    qc.clear();
  };

  return (
    <View className="flex-1 bg-surface dark:bg-dk-surface" style={{ paddingTop: insets.top }}>
      <View className="h-16 flex-row items-center gap-1 px-2">
        <Pressable onPress={() => router.back()} hitSlop={8} className="h-11 w-11 items-center justify-center rounded-full active:bg-surface-container">
          <Icon name="arrow-back" size={24} color="#464555" />
        </Pressable>
        <Text className={`font-inter-sb text-headline-sm ${ink}`}>Settings</Text>
      </View>

      <ScrollView className="px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32, gap: 24 }}>
        <View style={SHADOW_SM} className="gap-4 rounded-xl bg-surface-container-lowest p-4 dark:bg-dk-lowest">
          <View className="flex-row items-center gap-4">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary-fixed dark:bg-dk-container">
              <Text className="font-inter-sb text-headline-md text-on-primary-fixed dark:text-dk-primary">{initials}</Text>
            </View>
            <View className="flex-1">
              <Text className={`font-inter-sb text-headline-sm ${ink}`} numberOfLines={1}>{(email ?? '').split('@')[0] || 'Your account'}</Text>
              <Text className={`text-body-sm ${muted}`} numberOfLines={1}>{email ?? '—'}</Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between rounded-lg bg-surface-container-low p-2 dark:bg-dk-low">
            <View className="flex-row items-center gap-1 pl-1">
              <View className={`h-2 w-2 rounded-full ${smsAllowed ? 'bg-secondary' : 'bg-outline'}`} />
              <Text className={`font-inter-sb text-label-sm uppercase tracking-wider ${smsAllowed ? 'text-secondary' : muted}`}>{smsAllowed ? 'SMS access on' : 'SMS access off'}</Text>
            </View>
            <Pressable onPress={() => Linking.openSettings()} hitSlop={8} className="flex-row items-center pr-1">
              <Text className="font-inter-sb text-label-sm text-primary dark:text-dk-primary">Manage</Text>
              <Icon name="chevron-right" size={14} color="#3525cd" />
            </Pressable>
          </View>
        </View>

        <View>
          <SectionTitle right={<Text className="font-inter-md text-label-sm text-secondary">Local only</Text>}>Notifications & automation</SectionTitle>
          <Group>
            <Row icon="notifications-active" tint="brand" title="New payment alerts" sub="Checks for new bank SMS about every 15 minutes" right={<Toggle value={settings.newPayments} onChange={(v) => update({ newPayments: v })} />} />
            <Row icon="schedule" title="Daily reminder" sub="Once a day, only if payments are waiting" right={<Toggle value={settings.dailyReminder} onChange={(v) => update({ dailyReminder: v })} />}>
              {settings.dailyReminder ? (
                <View className="pb-4 pl-[72px] pr-4">
                  <Segmented options={HOURS.map((h) => ({ label: h.label, value: h.hour }))} value={settings.reminderHour} onChange={(hour) => update({ reminderHour: hour })} />
                </View>
              ) : null}
            </Row>
            <Row icon="visibility-off" title="Hide amounts on lock screen" sub="Notifications show only a count" right={<Toggle value={settings.hideDetails} onChange={(v) => update({ hideDetails: v })} />} />
          </Group>
        </View>

        <View>
          <SectionTitle>Appearance</SectionTitle>
          <Group>
            <Row icon="palette" title="Theme" sub="System follows your phone's dark mode">
              <View className="pb-4 pl-[72px] pr-4">
                <Segmented
                  options={[{ label: 'System', value: 'system' as ThemeMode }, { label: 'Light', value: 'light' as ThemeMode }, { label: 'Dark', value: 'dark' as ThemeMode }]}
                  value={theme}
                  onChange={(m) => { setTheme(m); saveThemeMode(m); }}
                />
              </View>
            </Row>
          </Group>
        </View>

        <View>
          <SectionTitle>Background check</SectionTitle>
          <Group>
            <Row icon="sync" title="Check for new payments now" sub={checking ? 'Checking…' : 'Scan SMS received since the last scan'} onPress={checkNow} right={<Icon name="chevron-right" size={18} color="#464555" />} />
            <Row icon="notifications-none" title="Send a test notification" sub="Make sure alerts reach you" onPress={testNotification} right={<Icon name="chevron-right" size={18} color="#464555" />} />
          </Group>
          {status ? <Text className={`mt-2 px-1 text-body-sm ${muted}`}>{status}</Text> : null}
        </View>

        <Pressable onPress={signOut} className="h-14 flex-row items-center justify-center gap-2 rounded-xl bg-error-container active:opacity-70 dark:bg-dk-error-container">
          <Icon name="logout" size={20} color="#ba1a1a" />
          <Text className="font-inter-sb text-label-lg text-error">Sign out</Text>
        </Pressable>
        <Text className="text-center text-label-sm text-outline">Expensefy • your SMS stay on your phone</Text>
      </ScrollView>
    </View>
  );
}

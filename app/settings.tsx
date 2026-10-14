import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { checkForNewPayments } from '../src/background/check';
import { syncBackgroundTask } from '../src/background/task';
import { supabase } from '../src/lib/supabase';
import { requestNotificationPermission, showNotification } from '../src/notifications/notify';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type NotifySettings } from '../src/notifications/settings';
import { hasSmsPermission } from '../src/sms/reader';
import { useAuthStore } from '../src/store/auth';
import { Button, Card, Chip, Pill, SectionLabel, Text, ink, muted, useInitials } from '../src/ui/components';

const HOURS = [
  { label: '9 am', hour: 9 },
  { label: '1 pm', hour: 13 },
  { label: '6 pm', hour: 18 },
  { label: '9 pm', hour: 21 },
];

function ToggleRow({ title, hint, value, onChange }: { title: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View className="min-h-14 flex-row items-center justify-between py-2">
      <View className="flex-1 pr-4">
        <Text className={`font-inter-md text-base ${ink}`}>{title}</Text>
        {hint ? <Text className={`text-xs ${muted}`}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: '#4f46e5' }} />
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

  useEffect(() => {
    loadSettings().then(setSettings);
    hasSmsPermission().then(setSmsAllowed);
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
    <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: insets.top }}>
      <View className="h-14 flex-row items-center gap-2 px-2">
        <Pressable onPress={() => router.back()} hitSlop={10} className="h-11 w-11 items-center justify-center rounded-full active:opacity-50">
          <Ionicons name="arrow-back" size={24} color="#64748b" />
        </Pressable>
        <Text className={`font-inter-sb text-xl ${ink}`}>Settings</Text>
      </View>

      <ScrollView className="px-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <Card className="mb-4 flex-row items-center gap-4 p-4">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-indigo-50 dark:bg-slate-800">
            <Text className="font-inter-b text-xl text-indigo-600">{initials}</Text>
          </View>
          <View className="flex-1">
            <Text className={`font-inter-sb text-base ${ink}`} numberOfLines={1}>{email ?? '—'}</Text>
            <View className="mt-1">
              <Pill label={smsAllowed ? 'SMS access on' : 'SMS access off'} tone={smsAllowed ? 'emerald' : 'amber'} />
            </View>
          </View>
        </Card>

        <View className="mb-1 px-1"><SectionLabel>SMS access</SectionLabel></View>
        <Card className="mb-4 flex-row items-center gap-3 p-4">
          <Ionicons name="chatbox-ellipses-outline" size={22} color="#4f46e5" />
          <View className="flex-1">
            <Text className={`font-inter-md ${ink}`}>Read bank & UPI SMS</Text>
            <Text className={`text-xs ${muted}`}>Processed on this phone. Only amount, payee, date, category and note are saved.</Text>
          </View>
          <Pressable onPress={() => Linking.openSettings()} hitSlop={10} className="min-h-11 justify-center">
            <Text className="font-inter-sb text-sm text-indigo-600">Manage</Text>
          </Pressable>
        </Card>

        <View className="mb-1 px-1"><SectionLabel>Notifications</SectionLabel></View>
        <Card className="mb-4 px-4 py-2">
          <ToggleRow
            title="New payments"
            hint="We check for new bank SMS about every 15 minutes, even when the app is closed."
            value={settings.newPayments}
            onChange={(v) => update({ newPayments: v })}
          />
          <ToggleRow title="Daily reminder" hint="Once a day, only if payments are waiting for review." value={settings.dailyReminder} onChange={(v) => update({ dailyReminder: v })} />
          {settings.dailyReminder && (
            <View className="flex-row flex-wrap gap-2 pb-2">
              {HOURS.map((h) => (
                <Chip key={h.hour} label={h.label} selected={settings.reminderHour === h.hour} onPress={() => update({ reminderHour: h.hour })} />
              ))}
            </View>
          )}
          <ToggleRow
            title="Hide amounts on the lock screen"
            hint="Notifications show only a count, never a payee or amount."
            value={settings.hideDetails}
            onChange={(v) => update({ hideDetails: v })}
          />
        </Card>

        <Card className="mb-4 gap-3 p-4">
          <Button icon="refresh-outline" label="Check for new payments now" loading={checking} onPress={checkNow} />
          <Button variant="secondary" icon="notifications-outline" label="Send a test notification" onPress={testNotification} />
          {status ? <Text className={muted}>{status}</Text> : null}
        </Card>

        <Button variant="danger" icon="log-out-outline" label="Sign out" onPress={signOut} />
        <Text className={`mt-4 text-center text-xs ${muted}`}>Expensefy · your SMS stay on your phone.</Text>
      </ScrollView>
    </View>
  );
}

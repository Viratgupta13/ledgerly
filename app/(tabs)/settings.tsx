import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, View } from 'react-native';
import { checkForNewPayments } from '../../src/background/check';
import { syncBackgroundTask } from '../../src/background/task';
import { supabase } from '../../src/lib/supabase';
import { requestNotificationPermission, showNotification } from '../../src/notifications/notify';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type NotifySettings } from '../../src/notifications/settings';
import { useAuthStore } from '../../src/store/auth';
import { Button, Card, Chip, Screen, ink, muted } from '../../src/ui/components';

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
        <Text className={`text-base font-medium ${ink}`}>{title}</Text>
        {hint ? <Text className={`text-xs ${muted}`}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

export default function SettingsScreen() {
  const qc = useQueryClient();
  const email = useAuthStore((s) => s.session?.user.email);
  const [settings, setSettings] = useState<NotifySettings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    loadSettings().then(setSettings);
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
    <Screen title="Settings">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <Card className="mb-4 p-4">
          <Text className={`text-xs uppercase ${muted}`}>Account</Text>
          <Text className={`mb-3 mt-1 text-base ${ink}`}>{email ?? '—'}</Text>
          <Button variant="secondary" icon="log-out-outline" label="Sign out" onPress={signOut} />
        </Card>

        <Card className="mb-4 px-4 py-2">
          <Text className={`mt-2 text-xs uppercase ${muted}`}>Notifications</Text>
          <ToggleRow
            title="New payments"
            hint="We check for new bank SMS about every 15 minutes, even when the app is closed."
            value={settings.newPayments}
            onChange={(v) => update({ newPayments: v })}
          />
          <ToggleRow
            title="Daily reminder"
            hint="Once a day, only if payments are waiting for review."
            value={settings.dailyReminder}
            onChange={(v) => update({ dailyReminder: v })}
          />
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

        <Text className={`px-1 text-xs ${muted}`}>
          Your SMS are read and processed on this phone. Only the amount, payee, date, category and note are saved.
        </Text>
      </ScrollView>
    </Screen>
  );
}

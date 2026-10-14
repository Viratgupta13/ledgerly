import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { AppState, useColorScheme } from 'react-native';
import { syncBackgroundTask } from '../../src/background/task';
import { useTxns } from '../../src/data/hooks';
import { loadSettings } from '../../src/notifications/settings';
import { autoScan } from '../../src/sms/scan';
import { useAuthStore } from '../../src/store/auth';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const screens: { name: string; title: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'home-outline', iconActive: 'home' },
  { name: 'inbox', title: 'Inbox', icon: 'mail-outline', iconActive: 'mail' },
  { name: 'transactions', title: 'Transactions', icon: 'list-outline', iconActive: 'list' },
  { name: 'rules', title: 'Rules', icon: 'funnel-outline', iconActive: 'funnel' },
  { name: 'settings', title: 'Settings', icon: 'settings-outline', iconActive: 'settings' },
];

export default function TabsLayout() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const qc = useQueryClient();
  const dark = useColorScheme() === 'dark';
  const pendingCount = useTxns('pending').data?.length ?? 0;

  // Make sure the periodic check is registered whenever a notification is switched on.
  useEffect(() => {
    loadSettings().then((s) => syncBackgroundTask(s)).catch(() => undefined);
  }, []);

  // Pick up new SMS whenever the app opens or comes back to the foreground.
  useEffect(() => {
    if (!userId) return;
    const run = () =>
      autoScan(userId)
        .then((summary) => {
          if (summary && summary.added > 0) qc.invalidateQueries({ queryKey: ['txns'] });
        })
        .catch(() => undefined);
    run();
    const sub = AppState.addEventListener('change', (state) => state === 'active' && run());
    return () => sub.remove();
  }, [userId, qc]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: dark ? '#818cf8' : '#4f46e5',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: { backgroundColor: dark ? '#0f172a' : '#ffffff', borderTopColor: dark ? '#1e293b' : '#e2e8f0' },
        tabBarLabelStyle: { fontWeight: '600' },
      }}
    >
      {screens.map(({ name, title, icon, iconActive }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarBadge: name === 'inbox' && pendingCount > 0 ? pendingCount : undefined,
            tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? iconActive : icon} color={color} size={size} />,
          }}
        />
      ))}
    </Tabs>
  );
}

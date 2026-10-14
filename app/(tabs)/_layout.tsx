import { MaterialIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { syncBackgroundTask } from '../../src/background/task';
import { useTxns } from '../../src/data/hooks';
import { loadSettings } from '../../src/notifications/settings';
import { autoScan } from '../../src/sms/scan';
import { useAuthStore } from '../../src/store/auth';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const screens: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'home' },
  { name: 'inbox', title: 'Inbox', icon: 'inbox' },
  { name: 'transactions', title: 'Transactions', icon: 'receipt-long' },
  { name: 'rules', title: 'Rules', icon: 'tune' },
];

export default function TabsLayout() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
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
        tabBarActiveTintColor: '#3525cd',
        tabBarInactiveTintColor: '#464555',
        tabBarStyle: {
          backgroundColor: '#faf8ff',
          borderTopWidth: 0,
          elevation: 8,
          height: 62 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 6,
        },
        tabBarLabelStyle: { fontFamily: 'Inter_600SemiBold', fontSize: 11, marginTop: 2 },
        tabBarBadgeStyle: { backgroundColor: '#950029', color: '#ffffff', fontFamily: 'Inter_700Bold', fontSize: 9, minWidth: 18, height: 16 },
      }}
    >
      {screens.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarBadge: name === 'inbox' && pendingCount > 0 ? pendingCount : undefined,
            tabBarIcon: ({ color }) => <MaterialIcons name={icon} color={color} size={24} />,
          }}
        />
      ))}
    </Tabs>
  );
}

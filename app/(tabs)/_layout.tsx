import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { autoScan } from '../../src/sms/scan';
import { useAuthStore } from '../../src/store/auth';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const screens: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'home-outline' },
  { name: 'inbox', title: 'Inbox', icon: 'mail-outline' },
  { name: 'transactions', title: 'Transactions', icon: 'list-outline' },
  { name: 'rules', title: 'Rules', icon: 'funnel-outline' },
];

export default function TabsLayout() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const qc = useQueryClient();

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
    <Tabs>
      {screens.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{ title, tabBarIcon: ({ color, size }) => <Ionicons name={icon} color={color} size={size} /> }}
        />
      ))}
    </Tabs>
  );
}

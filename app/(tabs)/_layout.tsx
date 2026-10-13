import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const screens: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'home-outline' },
  { name: 'inbox', title: 'Inbox', icon: 'mail-outline' },
  { name: 'transactions', title: 'Transactions', icon: 'list-outline' },
  { name: 'rules', title: 'Rules', icon: 'funnel-outline' },
];

export default function TabsLayout() {
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

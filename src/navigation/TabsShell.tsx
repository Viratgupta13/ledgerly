import { MaterialIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { syncBackgroundTask } from '../background/task';
import { useTxns } from '../data/hooks';
import { loadSettings } from '../notifications/settings';
import HomeScreen from '../screens/HomeScreen';
import InboxScreen from '../screens/InboxScreen';
import RulesScreen from '../screens/RulesScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import { autoScan } from '../sms/scan';
import { useAuthStore } from '../store/auth';
import { useTabStore } from '../store/tabs';
import { Text } from '../ui/components';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const TABS: { title: string; icon: IconName; Page: () => React.JSX.Element }[] = [
  { title: 'Home', icon: 'home', Page: HomeScreen },
  { title: 'Inbox', icon: 'inbox', Page: InboxScreen },
  { title: 'Transactions', icon: 'receipt-long', Page: TransactionsScreen },
  { title: 'Rules', icon: 'tune', Page: RulesScreen },
];

/**
 * The four tabs live in one native pager, so a swipe drags the page with your finger and snaps
 * on release. The bottom bar clears the system navigation bar via the bottom inset.
 */
export function TabsShell() {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.session?.user.id);
  const qc = useQueryClient();
  const pager = useRef<PagerView>(null);
  const [index, setIndex] = useState(0);
  const pending = useTxns('pending').data?.length ?? 0;
  const requested = useTabStore((s) => s.requested);

  useEffect(() => {
    if (requested) pager.current?.setPage(requested.index);
  }, [requested]);

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
    <View className="flex-1 bg-surface">
      <PagerView ref={pager} style={{ flex: 1 }} initialPage={0} overScrollMode="never" onPageSelected={(e) => setIndex(e.nativeEvent.position)}>
        {TABS.map(({ title, Page }) => (
          <View key={title} collapsable={false} style={{ flex: 1 }}>
            <Page />
          </View>
        ))}
      </PagerView>

      <View
        style={{ height: 62 + insets.bottom, paddingTop: 8, paddingBottom: insets.bottom + 6, elevation: 8, shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: -4 } }}
        className="flex-row bg-surface"
      >
        {TABS.map(({ title, icon }, i) => {
          const active = i === index;
          return (
            <Pressable key={title} onPress={() => pager.current?.setPage(i)} className="flex-1 items-center justify-center active:opacity-60">
              <View>
                <MaterialIcons name={icon} size={24} color={active ? '#3525cd' : '#464555'} />
                {title === 'Inbox' && pending > 0 ? (
                  <View className="absolute -right-3.5 -top-1 min-w-[18px] items-center rounded-full bg-tertiary px-1.5">
                    <Text className="font-inter-b text-[9px] leading-[16px] text-on-tertiary">{pending}</Text>
                  </View>
                ) : null}
              </View>
              <Text className={`mt-0.5 text-[11px] ${active ? 'font-inter-sb text-primary' : 'font-inter-sb text-on-surface-variant'}`}>{title}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

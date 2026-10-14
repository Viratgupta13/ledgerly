import { MaterialIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { AppState, Pressable, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import Animated, { useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
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

/** One bottom-bar item. The active colour fades in as the pager approaches this tab, in step with the finger. */
function TabItem({ i, title, icon, progress, badge, onPress }: { i: number; title: string; icon: IconName; progress: SharedValue<number>; badge: number; onPress: () => void }) {
  const activeStyle = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - Math.abs(progress.value - i)) }));
  const idleStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, Math.abs(progress.value - i)) }));
  const layer = (color: string, weight: string) => (
    <View className="items-center">
      <MaterialIcons name={icon} size={24} color={color} />
      <Text className={`mt-0.5 text-[11px] ${weight}`} style={{ color }}>{title}</Text>
    </View>
  );
  return (
    <Pressable onPress={onPress} className="flex-1 items-center justify-center active:opacity-60">
      <View>
        <Animated.View style={idleStyle}>{layer('#464555', 'font-inter-sb')}</Animated.View>
        <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: 0 }, activeStyle]}>{layer('#3525cd', 'font-inter-sb')}</Animated.View>
        {badge > 0 ? (
          <View className="absolute -top-1 right-2 min-w-[18px] items-center rounded-full bg-tertiary px-1.5">
            <Text className="font-inter-b text-[9px] leading-[16px] text-on-tertiary">{badge}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * The four tabs live in one native pager, so a swipe drags the page with your finger and snaps
 * on release. The bottom bar clears the system navigation bar via the bottom inset.
 */
export function TabsShell() {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.session?.user.id);
  const qc = useQueryClient();
  const pager = useRef<PagerView>(null);
  const progress = useSharedValue(0);
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
      <PagerView ref={pager} style={{ flex: 1 }} initialPage={0} overScrollMode="never" onPageScroll={(e) => { progress.value = e.nativeEvent.position + e.nativeEvent.offset; }}>
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
        {TABS.map(({ title, icon }, i) => (
          <TabItem key={title} i={i} title={title} icon={icon} progress={progress} badge={title === 'Inbox' ? pending : 0} onPress={() => pager.current?.setPage(i)} />
        ))}
      </View>
    </View>
  );
}

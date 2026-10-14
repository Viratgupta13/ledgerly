import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scanAndImport } from '../src/sms/scan';
import { useAuthStore } from '../src/store/auth';
import { Button, Icon, SHADOW_SM, Text, ink, muted, type IconName } from '../src/ui/components';

const POINTS: { icon: IconName; box: string; color: string; title: string; body: string }[] = [
  { icon: 'filter-alt', box: 'bg-surface-container-high', color: '#3525cd', title: 'We only look for payment messages', body: 'Transactional alerts from banks & UPI apps only.' },
  { icon: 'security', box: 'bg-tertiary-fixed', color: '#950029', title: 'OTPs and promos are ignored', body: 'Sensitive security codes & marketing spam are never saved.' },
  { icon: 'receipt-long', box: 'bg-secondary-container', color: '#00714d', title: 'Nothing but the basics is saved', body: 'Amount, payee, date, category and your note. Never the SMS text.' },
];

/** Shown before Android's own permission dialog, to explain what SMS access is for. */
export default function SmsPermission() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allow = async () => {
    if (!userId) return;
    setBusy(true);
    setError(null);
    try {
      await scanAndImport(userId, 30, { askPermission: true });
      qc.invalidateQueries({ queryKey: ['txns'] });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read SMS.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-surface dark:bg-dk-surface" style={{ paddingTop: insets.top + 16 }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <View className="pb-2">
          <View className="flex-row items-center gap-1.5 self-start rounded-full bg-surface-container-low px-3 py-1 dark:bg-dk-low">
            <View className="h-1.5 w-1.5 rounded-full bg-primary" />
            <Text className="font-inter-sb text-label-sm uppercase tracking-wider text-primary dark:text-dk-primary">Setup • SMS access</Text>
          </View>
        </View>

        <View style={SHADOW_SM} className="my-2 gap-2 overflow-hidden rounded-2xl bg-surface-container-low p-4 dark:bg-dk-low">
          <View className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-primary opacity-10" />
          <View style={{ transform: [{ rotate: '-1deg' }] }} className="rounded-xl bg-surface-container-lowest p-3 dark:bg-dk-lowest">
            <View className="mb-1.5 flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <View className="h-5 w-5 items-center justify-center rounded-md bg-surface-container-high">
                  <Icon name="sms" size={13} color="#3525cd" />
                </View>
                <Text className={`font-inter-md text-label-sm ${muted}`}>Example bank SMS • VK-HDFCBK</Text>
              </View>
              <Text className="text-label-sm text-outline">Just now</Text>
            </View>
            <Text className={`text-body-sm ${ink}`}>
              A/c XX4092 debited <Text className="font-inter-sb text-tertiary">INR 349.00</Text> at <Text className="font-inter-sb">BLINKIT</Text> on 24-Oct. UPI Ref 429810...
            </Text>
          </View>
          <View className="flex-row items-center justify-center gap-2 py-0.5">
            <View className="h-1.5 w-1.5 rounded-full bg-primary/40" />
            <View className="flex-row items-center gap-1 rounded-full bg-surface-container-high px-2.5 py-0.5 dark:bg-dk-container">
              <Icon name="auto-awesome" size={14} color="#3525cd" />
              <Text className="font-inter-sb text-label-sm uppercase tracking-wider text-primary dark:text-dk-primary">Auto-parsed</Text>
            </View>
            <View className="h-1.5 w-1.5 rounded-full bg-primary/40" />
          </View>
          <View style={{ transform: [{ rotate: '1deg' }] }} className="flex-row items-center justify-between rounded-xl bg-surface-container-lowest p-3 dark:bg-dk-lowest">
            <View className="flex-1 flex-row items-center gap-2.5">
              <View className="h-9 w-9 items-center justify-center rounded-lg bg-secondary-container">
                <Icon name="shopping-basket" size={18} color="#00714d" />
              </View>
              <View className="flex-1">
                <Text className={`font-inter-sb text-title-md ${ink}`} numberOfLines={1}>Blinkit Grocery</Text>
                <View className="flex-row items-center gap-1">
                  <View className="h-1.5 w-1.5 rounded-full bg-secondary" />
                  <Text className={`text-body-sm ${muted}`}>HDFC • Groceries</Text>
                </View>
              </View>
            </View>
            <View className="items-end pl-2">
              <Text className={`font-inter-sb text-title-md ${ink}`}>-₹349.00</Text>
              <Text className="font-inter-md text-label-sm text-secondary">Logged instantly</Text>
            </View>
          </View>
        </View>

        <View className="mb-4 mt-2">
          <Text className={`font-inter-sb text-headline-lg ${ink}`}>Let Ledgerly read your bank SMS</Text>
          <Text className={`mt-1.5 text-body-md ${muted}`}>To track your expenses with almost no typing, Ledgerly needs SMS read access.</Text>
        </View>

        <View className="mb-4 gap-2.5">
          {POINTS.map((p) => (
            <View key={p.title} style={SHADOW_SM} className="flex-row items-start gap-3 rounded-xl bg-surface-container-lowest p-3 dark:bg-dk-lowest">
              <View className={`mt-0.5 h-9 w-9 items-center justify-center rounded-lg ${p.box}`}>
                <Icon name={p.icon} size={20} color={p.color} />
              </View>
              <View className="flex-1">
                <Text className={`font-inter-sb text-title-md ${ink}`}>{p.title}</Text>
                <Text className={`mt-0.5 text-body-sm ${muted}`}>{p.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View className="mb-2 flex-row items-center justify-center gap-2 rounded-full bg-surface-container px-3 py-2 dark:bg-dk-container">
          <Icon name="lock" size={16} color="#3525cd" />
          <Text className={`font-inter-sb text-label-md ${ink}`}>SMS are processed on this phone, not uploaded</Text>
        </View>
        {error && <Text className="mt-2 text-error">{error}</Text>}
      </ScrollView>

      <View className="gap-2 px-4" style={{ paddingBottom: insets.bottom + 12 }}>
        <Button size="lg" className="bg-primary-container" label="Allow SMS access" iconRight="arrow-forward" loading={busy} onPress={allow} />
        <Button size="sm" variant="secondary" className="bg-transparent" label="Not now" onPress={() => router.back()} />
        <Text className="mt-1 text-center text-label-sm text-outline">You can change or revoke this permission anytime in Android Settings.</Text>
      </View>
    </View>
  );
}

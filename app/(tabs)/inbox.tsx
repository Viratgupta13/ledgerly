import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { ConfirmBatchModal } from '../../src/components/ConfirmBatchModal';
import { PendingCard } from '../../src/components/PendingCard';
import { useCategoryNames, useNoteSuggestions, useTxns } from '../../src/data/hooks';
import { hasSmsPermission } from '../../src/sms/reader';
import { scanAndImport } from '../../src/sms/scan';
import { useAuthStore } from '../../src/store/auth';
import { Button, Card, Chip, Empty, Icon, Pill, SHADOW_SM, Screen, Text, ink, muted } from '../../src/ui/components';

const RANGES = [
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '1 year', days: 365 },
];

export default function InboxScreen() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const qc = useQueryClient();
  const router = useRouter();
  const pending = useTxns('pending');
  const categories = useCategoryNames();
  const suggestions = useNoteSuggestions();
  const [previewing, setPreviewing] = useState(false);
  const [days, setDays] = useState(30);

  const scan = useMutation({
    mutationFn: () => scanAndImport(userId as string, days, { askPermission: true }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['txns'] }),
  });

  // First time: explain why we need SMS access before Android shows its own dialog.
  const startScan = async () => {
    if (await hasSmsPermission()) scan.mutate();
    else router.push('/sms-permission');
  };

  const all = pending.data ?? [];
  const ready = all.filter((t) => t.type === 'debit' && t.category);

  const header = (
    <View className="gap-6 pb-6">
      <View className="flex-row items-end justify-between">
        <View className="flex-1">
          <Text className={`font-inter-sb text-headline-lg ${ink}`}>Inbox</Text>
          <Text className={`mt-0.5 text-body-md ${muted}`}>{all.length} pending {all.length === 1 ? 'transaction' : 'transactions'} to review</Text>
        </View>
        {all.length > 0 && <Pill tone="tertiary" icon="notifications-active" label={`${all.length} new`} />}
      </View>

      <View style={SHADOW_SM} className="gap-4 rounded-[20px] bg-surface-container-lowest p-4 dark:bg-dk-lowest">
        <View className="flex-row items-center gap-2">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary-fixed dark:bg-dk-container">
            <Icon name="sms" size={22} color="#3525cd" />
          </View>
          <View className="flex-1">
            <Text className={`font-inter-sb text-title-md ${ink}`}>Scan Bank & UPI SMS</Text>
            <Text className={`text-body-sm ${muted}`}>Auto-detect debits and credits</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          {RANGES.map((r) => (
            <Chip key={r.days} label={r.label} selected={days === r.days} onPress={() => setDays(r.days)} />
          ))}
        </View>
        <Button icon="play-circle-outline" label={scan.isPending ? 'Scanning…' : 'Scan SMS Inbox'} loading={scan.isPending} disabled={!userId} onPress={startScan} />
        {scan.error && <Text className="text-error">{scan.error.message}</Text>}
        {scan.data && (
          <View className="flex-row items-center gap-2.5 rounded-xl bg-surface-container-low px-3 py-2.5 dark:bg-dk-low">
            <Icon name="check-circle" size={18} color="#006c49" />
            <Text className={`flex-1 text-body-sm ${ink}`}>
              Read <Text className="font-inter-sb">{scan.data.scanned} SMS</Text>, found <Text className="font-inter-sb">{scan.data.found} payments</Text> (<Text className="font-inter-sb text-primary">{scan.data.added} new</Text>).
            </Text>
          </View>
        )}
      </View>

      {ready.length > 0 && (
        <View style={SHADOW_SM} className="gap-3 overflow-hidden rounded-2xl bg-surface-container-high p-4 dark:bg-dk-container">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 gap-0.5">
              <View className="flex-row items-center gap-1.5">
                <Icon name="auto-fix-high" size={18} color="#3525cd" />
                <Text className="font-inter-sb text-label-md uppercase tracking-wide text-primary dark:text-dk-primary">Smart Auto-Match</Text>
              </View>
              <Text className={`font-inter-sb text-title-md ${ink}`}>Review {ready.length} pre-sorted</Text>
              <Text className={`text-body-sm ${muted}`}>Categorized automatically from your past choices.</Text>
            </View>
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-fixed dark:bg-dk-low">
              <Icon name="done-all" size={20} color="#3525cd" />
            </View>
          </View>
          <Button size="sm" label={`Confirm all ${ready.length}`} iconRight="arrow-forward" onPress={() => setPreviewing(true)} />
        </View>
      )}

      {pending.error && <Text className="text-error">{pending.error.message}</Text>}
      {all.length > 0 && <Text className={`font-inter-sb text-headline-sm ${ink}`}>Pending Transactions</Text>}
    </View>
  );

  return (
    <Screen tab={1}>
      <FlatList
        data={all}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View className="h-2" />}
        renderItem={({ item }) => <PendingCard txn={item} categories={categories} suggestions={suggestions} />}
        ListEmptyComponent={pending.isLoading ? <ActivityIndicator /> : <Empty icon="inbox" title="All caught up" hint="Scan your SMS to find new payments." />}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        initialNumToRender={8}
        windowSize={7}
        showsVerticalScrollIndicator={false}
      />
      <ConfirmBatchModal visible={previewing} txns={ready} categories={categories} onClose={() => setPreviewing(false)} />
    </Screen>
  );
}

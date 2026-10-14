import { Ionicons } from '@expo/vector-icons';
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
import { Button, Card, Chip, Empty, Pill, Screen, Text, ink, muted } from '../../src/ui/components';

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
    <View className="mb-3 gap-3">
      <Card className="p-4">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-surface-container dark:bg-dk-container">
            <Ionicons name="chatbox-ellipses-outline" size={20} color="#3525cd" />
          </View>
          <View className="flex-1">
            <Text className={`font-inter-sb text-base ${ink}`}>Scan bank & UPI SMS</Text>
            <Text className={`text-xs ${muted}`}>Finds payments in your messages</Text>
          </View>
        </View>
        <View className="mt-3 flex-row gap-2">
          {RANGES.map((r) => (
            <Chip key={r.days} label={r.label} selected={days === r.days} onPress={() => setDays(r.days)} />
          ))}
        </View>
        <Button className="mt-3" icon="scan-outline" label={scan.isPending ? 'Scanning…' : 'Scan SMS inbox'} loading={scan.isPending} disabled={!userId} onPress={startScan} />
        {scan.error && <Text className="mt-3 text-error">{scan.error.message}</Text>}
        {scan.data && (
          <View className="mt-3 flex-row items-center gap-2 rounded-xl bg-surface-container-low p-3 dark:bg-dk-container">
            <Ionicons name="checkmark-circle-outline" size={18} color="#006c49" />
            <Text className={`flex-1 text-sm ${muted}`}>
              Read {scan.data.scanned} SMS, found {scan.data.found} payments ({scan.data.added} new).
            </Text>
          </View>
        )}
      </Card>

      {ready.length > 0 && (
        <View className="rounded-2xl bg-primary-fixed p-4 dark:bg-dk-low">
          <View className="flex-row items-center gap-2">
            <Ionicons name="sparkles-outline" size={16} color="#3525cd" />
            <Text className="font-inter-sb text-xs uppercase tracking-wider text-primary">Pre-sorted</Text>
          </View>
          <Text className={`mt-1 font-inter-sb text-lg ${ink}`}>Review {ready.length} sorted payments</Text>
          <Text className={`mt-0.5 text-sm ${muted}`}>Categorised from your past choices. Check them once, confirm together.</Text>
          <Button className="mt-3" label={`Review & confirm ${ready.length}`} iconRight="arrow-forward" onPress={() => setPreviewing(true)} />
        </View>
      )}
      {pending.error && <Text className="text-error">{pending.error.message}</Text>}
      {all.length > 0 && <Text className={`mt-1 font-inter-sb text-lg ${ink}`}>Pending transactions</Text>}
    </View>
  );

  return (
    <Screen
      title="Inbox"
      subtitle={`${all.length} pending ${all.length === 1 ? 'transaction' : 'transactions'} to review`}
      right={all.length > 0 ? <Pill tone="rose" label={`${all.length} new`} /> : undefined}
    >
      <FlatList
        data={all}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => <PendingCard txn={item} categories={categories} suggestions={suggestions} />}
        ListEmptyComponent={
          pending.isLoading ? <ActivityIndicator className="mt-8" /> : <Empty icon="checkmark-circle-outline" title="All caught up" hint="Scan your SMS to find new payments." />
        }
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

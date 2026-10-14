import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { ConfirmBatchModal } from '../../src/components/ConfirmBatchModal';
import { PendingCard } from '../../src/components/PendingCard';
import { useTxns } from '../../src/data/hooks';
import { scanAndImport } from '../../src/sms/scan';
import { useAuthStore } from '../../src/store/auth';

const RANGES = [
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '1 year', days: 365 },
];

export default function InboxScreen() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const qc = useQueryClient();
  const pending = useTxns('pending');
  const [previewing, setPreviewing] = useState(false);
  const [days, setDays] = useState(30);

  const scan = useMutation({
    mutationFn: () => scanAndImport(userId as string, days, { askPermission: true }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['txns'] }),
  });

  const debits = (pending.data ?? []).filter((t) => t.type === 'debit');
  const withCategory = debits.filter((t) => t.category).length;

  return (
    <View className="flex-1 bg-white px-4 pt-4 dark:bg-black">
      <View className="flex-row gap-2">
        {RANGES.map((r) => (
          <Pressable
            key={r.days}
            onPress={() => setDays(r.days)}
            className={`rounded-full border px-3 py-1 ${days === r.days ? 'border-blue-600 bg-blue-600' : 'border-gray-300 dark:border-gray-700'}`}
          >
            <Text className={days === r.days ? 'text-white' : 'text-black dark:text-white'}>{r.label}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        className="mt-3 items-center rounded-lg bg-blue-600 py-3"
        onPress={() => scan.mutate()}
        disabled={scan.isPending || !userId}
      >
        <Text className="font-semibold text-white">{scan.isPending ? 'Scanning…' : `Scan last ${RANGES.find((r) => r.days === days)?.label} of SMS`}</Text>
      </Pressable>

      {scan.error && <Text className="mt-3 text-red-600">{scan.error.message}</Text>}
      {scan.data && (
        <Text className="mt-3 text-gray-600 dark:text-gray-300">
          Read {scan.data.scanned} SMS, found {scan.data.found} transactions, {scan.data.added} new.
        </Text>
      )}

      {debits.length > 0 && (
        <Pressable className="mt-3 items-center rounded-lg border border-blue-600 py-3" onPress={() => setPreviewing(true)}>
          <Text className="font-semibold text-blue-600">Review & confirm {debits.length} payments{withCategory > 0 ? ` (${withCategory} with a category)` : ''}</Text>
        </Pressable>
      )}
      <ConfirmBatchModal visible={previewing} txns={debits} onClose={() => setPreviewing(false)} />

      {pending.isLoading && <ActivityIndicator className="mt-6" />}
      {pending.error && <Text className="mt-3 text-red-600">{pending.error.message}</Text>}
      <Text className="mb-2 mt-4 text-lg font-semibold text-black dark:text-white">
        To review ({pending.data?.length ?? 0})
      </Text>
      <FlatList
        data={pending.data ?? []}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <PendingCard txn={item} />}
        ListEmptyComponent={!pending.isLoading ? <Text className="text-gray-500">Nothing to review.</Text> : null}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        windowSize={7}
      />
    </View>
  );
}

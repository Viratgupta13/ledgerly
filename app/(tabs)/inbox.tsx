import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { ConfirmBatchModal } from '../../src/components/ConfirmBatchModal';
import { PendingCard } from '../../src/components/PendingCard';
import { useCategoryNames, useNoteSuggestions, useTxns } from '../../src/data/hooks';
import { scanAndImport } from '../../src/sms/scan';
import { useAuthStore } from '../../src/store/auth';
import { Button, Card, Chip, Empty, Screen, ink, muted } from '../../src/ui/components';

const RANGES = [
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '1 year', days: 365 },
];

export default function InboxScreen() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const qc = useQueryClient();
  const pending = useTxns('pending');
  const categories = useCategoryNames();
  const suggestions = useNoteSuggestions();
  const [previewing, setPreviewing] = useState(false);
  const [days, setDays] = useState(30);

  const scan = useMutation({
    mutationFn: () => scanAndImport(userId as string, days, { askPermission: true }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['txns'] }),
  });

  const all = pending.data ?? [];
  const ready = all.filter((t) => t.type === 'debit' && t.category);

  const header = (
    <View className="mb-3 gap-3">
      <Card className="gap-3 p-4">
        <View className="flex-row gap-2">
          {RANGES.map((r) => (
            <Chip key={r.days} label={r.label} selected={days === r.days} onPress={() => setDays(r.days)} />
          ))}
        </View>
        <Button icon="scan-outline" label={scan.isPending ? 'Scanning…' : 'Scan SMS'} loading={scan.isPending} disabled={!userId} onPress={() => scan.mutate()} />
        {scan.error && <Text className="text-rose-600">{scan.error.message}</Text>}
        {scan.data && (
          <Text className={muted}>Read {scan.data.scanned} SMS, found {scan.data.found} payments, {scan.data.added} new.</Text>
        )}
      </Card>

      {ready.length > 0 && (
        <Button variant="secondary" icon="checkmark-done-outline" label={`Review & confirm ${ready.length} pre-sorted`} onPress={() => setPreviewing(true)} />
      )}
      {pending.error && <Text className="text-rose-600">{pending.error.message}</Text>}
    </View>
  );

  return (
    <Screen title="Inbox" subtitle={`${all.length} to review`}>
      <FlatList
        data={all}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={header}
        renderItem={({ item }) => <PendingCard txn={item} categories={categories} suggestions={suggestions} />}
        ListEmptyComponent={
          pending.isLoading ? (
            <ActivityIndicator className="mt-8" />
          ) : (
            <Empty icon="checkmark-circle-outline" title="All caught up" hint="Scan your SMS to find new payments." />
          )
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        initialNumToRender={8}
        windowSize={7}
      />
      <ConfirmBatchModal visible={previewing} txns={ready} categories={categories} onClose={() => setPreviewing(false)} />
    </Screen>
  );
}

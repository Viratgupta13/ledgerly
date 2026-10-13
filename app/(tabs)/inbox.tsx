import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { PendingCard } from '../../src/components/PendingCard';
import { importParsed } from '../../src/data/api';
import { useTxns } from '../../src/data/hooks';
import { parseSms, type ParsedTxn, type RawSms } from '../../src/parser';
import { readInbox, requestSmsPermission } from '../../src/sms/reader';
import { useAuthStore } from '../../src/store/auth';

async function scanAndImport(userId: string) {
  if (!(await requestSmsPermission())) throw new Error('SMS permission was not granted.');
  const messages = await readInbox({ days: 30 });
  const items: { sms: RawSms; txn: ParsedTxn }[] = [];
  for (const sms of messages) {
    const result = parseSms(sms);
    if (result.ok) items.push({ sms, txn: result.txn });
  }
  const added = await importParsed(userId, items);
  return { scanned: messages.length, found: items.length, added };
}

export default function InboxScreen() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const qc = useQueryClient();
  const pending = useTxns('pending');
  const scan = useMutation({
    mutationFn: () => scanAndImport(userId as string),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['txns'] }),
  });

  return (
    <View className="flex-1 bg-white px-4 pt-12 dark:bg-black">
      <Pressable
        className="items-center rounded-lg bg-blue-600 py-3"
        onPress={() => scan.mutate()}
        disabled={scan.isPending || !userId}
      >
        <Text className="font-semibold text-white">{scan.isPending ? 'Scanning…' : 'Scan last 30 days of SMS'}</Text>
      </Pressable>

      {scan.error && <Text className="mt-3 text-red-600">{scan.error.message}</Text>}
      {scan.data && (
        <Text className="mt-3 text-gray-600 dark:text-gray-300">
          Read {scan.data.scanned} SMS, found {scan.data.found} transactions, {scan.data.added} new.
        </Text>
      )}

      {pending.isLoading && <ActivityIndicator className="mt-6" />}
      {pending.error && <Text className="mt-3 text-red-600">{pending.error.message}</Text>}
      <Text className="mt-4 mb-2 text-lg font-semibold text-black dark:text-white">
        To review ({pending.data?.length ?? 0})
      </Text>
      <FlatList
        data={pending.data ?? []}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <PendingCard txn={item} />}
        ListEmptyComponent={!pending.isLoading ? <Text className="text-gray-500">Nothing to review.</Text> : null}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

import { useMutation } from '@tanstack/react-query';
import { FlatList, Pressable, Text, View } from 'react-native';
import { parseSms, type ParsedTxn } from '../../src/parser';
import { readInbox, requestSmsPermission } from '../../src/sms/reader';

type ScanResult = { scanned: number; txns: ParsedTxn[] };

async function scan(): Promise<ScanResult> {
  if (!(await requestSmsPermission())) throw new Error('SMS permission was not granted.');
  const messages = await readInbox({ days: 30 });
  const txns: ParsedTxn[] = [];
  for (const sms of messages) {
    const result = parseSms(sms);
    if (result.ok) txns.push(result.txn);
  }
  return { scanned: messages.length, txns };
}

const rupees = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function InboxScreen() {
  const mutation = useMutation({ mutationFn: scan });
  const data = mutation.data;

  return (
    <View className="flex-1 bg-white px-4 pt-12 dark:bg-black">
      <Pressable
        className="items-center rounded-lg bg-blue-600 py-3"
        onPress={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        <Text className="font-semibold text-white">{mutation.isPending ? 'Scanning…' : 'Scan last 30 days of SMS'}</Text>
      </Pressable>

      {mutation.error && <Text className="mt-3 text-red-600">{mutation.error.message}</Text>}
      {data && (
        <Text className="mt-3 text-gray-600 dark:text-gray-300">
          Read {data.scanned} SMS, found {data.txns.length} transactions.
        </Text>
      )}

      <FlatList
        className="mt-3"
        data={data?.txns ?? []}
        keyExtractor={(t, i) => `${t.bankRef ?? t.occurredAt}-${i}`}
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between border-b border-gray-200 py-3 dark:border-gray-800">
            <View className="flex-1 pr-3">
              <Text className="text-black dark:text-white" numberOfLines={1}>{item.merchant ?? 'Unknown'}</Text>
              <Text className="text-xs text-gray-500">{new Date(item.occurredAt).toLocaleString('en-IN')}</Text>
            </View>
            <Text className={item.type === 'debit' ? 'font-semibold text-red-600' : 'font-semibold text-green-600'}>
              {item.type === 'debit' ? '-' : '+'}{rupees(item.amount)}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

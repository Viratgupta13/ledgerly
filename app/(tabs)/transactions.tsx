import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { rupees } from '../../src/components/PendingCard';
import { useTxns } from '../../src/data/hooks';

export default function TransactionsScreen() {
  const { data, isLoading, error } = useTxns('confirmed');

  return (
    <View className="flex-1 bg-white px-4 pt-12 dark:bg-black">
      {isLoading && <ActivityIndicator />}
      {error && <Text className="text-red-600">{error.message}</Text>}
      <FlatList
        data={data ?? []}
        keyExtractor={(t) => t.id}
        ListEmptyComponent={!isLoading ? <Text className="text-gray-500">No confirmed transactions yet.</Text> : null}
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between border-b border-gray-200 py-3 dark:border-gray-800">
            <View className="flex-1 pr-3">
              <Text className="text-black dark:text-white" numberOfLines={1}>{item.merchant ?? 'Unknown'}</Text>
              <Text className="text-xs text-gray-500" numberOfLines={1}>
                {[item.category, item.note, new Date(item.occurred_at).toLocaleDateString('en-IN')].filter(Boolean).join(' · ')}
              </Text>
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

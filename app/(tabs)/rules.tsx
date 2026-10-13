import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { useDeleteRule, useRules } from '../../src/data/hooks';

export default function RulesScreen() {
  const { data, isLoading, error } = useRules();
  const remove = useDeleteRule();

  return (
    <View className="flex-1 bg-white px-4 pt-12 dark:bg-black">
      {isLoading && <ActivityIndicator />}
      {error && <Text className="text-red-600">{error.message}</Text>}
      <FlatList
        data={data ?? []}
        keyExtractor={(r) => r.id}
        ListEmptyComponent={
          !isLoading ? (
            <Text className="text-gray-500">No rules yet. Turn on "Always use…" while confirming a transaction.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between border-b border-gray-200 py-3 dark:border-gray-800">
            <View className="flex-1 pr-3">
              <Text className="text-black dark:text-white" numberOfLines={1}>{item.payee_key}</Text>
              <Text className="text-xs text-gray-500">{item.category}</Text>
            </View>
            <Pressable onPress={() => remove.mutate(item.id)} disabled={remove.isPending}>
              <Text className="text-red-600">Delete</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

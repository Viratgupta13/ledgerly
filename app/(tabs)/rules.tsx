import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useDeleteRule, useRules } from '../../src/data/hooks';
import { Card, Empty, LinkButton, Screen, ink, muted } from '../../src/ui/components';
import { categoryColor } from '../../src/ui/theme';

export default function RulesScreen() {
  const { data, isLoading, error } = useRules();
  const remove = useDeleteRule();

  return (
    <Screen title="Rules" subtitle="Payees you always put in the same category">
      {error && <Text className="mb-2 text-rose-600">{error.message}</Text>}
      <FlatList
        data={data ?? []}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          isLoading ? <ActivityIndicator className="mt-8" /> : <Empty icon="funnel-outline" title="No rules yet" hint={'Turn on "Always use…" while confirming a payment.'} />
        }
        renderItem={({ item }) => (
          <Card className="mb-2 flex-row items-center justify-between px-4 py-2">
            <View className="flex-1 pr-3">
              <Text className={`font-semibold ${ink}`} numberOfLines={1}>{item.payee_key}</Text>
              <View className="mt-1 flex-row items-center gap-2">
                <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: categoryColor(item.category) }} />
                <Text className={`text-xs ${muted}`}>{item.category}</Text>
              </View>
            </View>
            <LinkButton tone="danger" label="Delete" onPress={() => remove.mutate(item.id)} />
          </Card>
        )}
      />
    </Screen>
  );
}

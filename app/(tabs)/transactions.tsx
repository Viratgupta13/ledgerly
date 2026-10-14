import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { PendingCard } from '../../src/components/PendingCard';
import { useCategoryNames, useNoteSuggestions, useTxns } from '../../src/data/hooks';
import { Amount, Card, Empty, Screen, ink, muted } from '../../src/ui/components';
import { categoryColor } from '../../src/ui/theme';

export default function TransactionsScreen() {
  const { data, isLoading, error } = useTxns('confirmed');
  const categories = useCategoryNames();
  const suggestions = useNoteSuggestions();
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <Screen title="Transactions" subtitle="Tap a payment to change its category or note">
      {error && <Text className="mb-2 text-rose-600">{error.message}</Text>}
      <FlatList
        data={data ?? []}
        keyExtractor={(t) => t.id}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        initialNumToRender={12}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={isLoading ? <ActivityIndicator className="mt-8" /> : <Empty icon="receipt-outline" title="Nothing confirmed yet" hint="Confirmed payments show up here." />}
        renderItem={({ item }) =>
          editing === item.id ? (
            <PendingCard txn={item} categories={categories} suggestions={suggestions} mode="edit" onDone={() => setEditing(null)} />
          ) : (
            <Pressable disabled={item.type !== 'debit'} onPress={() => setEditing(item.id)} className="mb-2 active:opacity-60">
              <Card className="flex-row items-center justify-between p-4">
                <View className="flex-1 pr-3">
                  <Text className={`font-semibold ${ink}`} numberOfLines={1}>{item.merchant ?? 'Unknown'}</Text>
                  <View className="mt-1 flex-row items-center gap-2">
                    {item.category && <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: categoryColor(item.category) }} />}
                    <Text className={`flex-1 text-xs ${muted}`} numberOfLines={1}>
                      {[item.category, item.note, new Date(item.occurred_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                </View>
                <Amount value={item.amount} type={item.type} />
              </Card>
            </Pressable>
          )
        }
      />
    </Screen>
  );
}

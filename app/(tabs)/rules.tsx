import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, View } from 'react-native';
import { useAddRule, useCategoryNames, useDeleteRule, useRules } from '../../src/data/hooks';
import { toPayeeKey } from '../../src/parser/extract';
import { Button, Card, CategoryTile, Chip, Empty, Input, Pill, Screen, SectionLabel, Text, ink, muted } from '../../src/ui/components';
import { categoryColor } from '../../src/ui/theme';

export default function RulesScreen() {
  const { data, isLoading, error } = useRules();
  const categories = useCategoryNames();
  const remove = useDeleteRule();
  const add = useAddRule();
  const [payee, setPayee] = useState('');
  const [category, setCategory] = useState<string | null>(null);

  const key = toPayeeKey(payee.trim());
  const canCreate = !!key && !!category;

  const create = () => {
    if (!key || !category) return;
    add.mutate({ payeeKey: key, category }, { onSuccess: () => { setPayee(''); setCategory(null); } });
  };

  const confirmDelete = (id: string, payeeKey: string) =>
    Alert.alert('Delete rule?', `Future payments to "${payeeKey}" will no longer be sorted automatically.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(id) },
    ]);

  const header = (
    <View className="mb-3 gap-3">
      <Card className="p-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="flash-outline" size={18} color="#4f46e5" />
          <Text className={`font-inter-sb text-base ${ink}`}>Quick add rule</Text>
        </View>
        <View className="mt-3">
          <Input label="When the payee is" placeholder="e.g. Blinkit, Zomato, Rapido" value={payee} onChangeText={setPayee} autoCapitalize="none" />
        </View>
        <View className="mt-4">
          <SectionLabel>Put it in</SectionLabel>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {categories.map((c) => (
              <Chip key={c} label={c} check dot={categoryColor(c)} selected={category === c} onPress={() => setCategory(category === c ? null : c)} />
            ))}
          </View>
        </View>
        {add.error && <Text className="mt-2 text-rose-600">{add.error.message}</Text>}
        <Button className="mt-4" icon="add-circle-outline" label="Create rule" disabled={!canCreate} loading={add.isPending} onPress={create} />
      </Card>
      {(data ?? []).length > 0 && <Text className={`font-inter-sb text-lg ${ink}`}>Your rules</Text>}
    </View>
  );

  return (
    <Screen title="Rules" subtitle="Payees that always go to the same category" right={<Pill label={`${(data ?? []).length} active`} tone="emerald" />}>
      {error && <Text className="mb-2 text-rose-600">{error.message}</Text>}
      <FlatList
        data={data ?? []}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={isLoading ? <ActivityIndicator className="mt-8" /> : <Empty icon="funnel-outline" title="No rules yet" hint={'Add one above, or turn on "Always use…" while confirming a payment.'} />}
        ListFooterComponent={
          <View className="mt-2 flex-row gap-3 rounded-2xl bg-indigo-50 p-4 dark:bg-slate-900">
            <Ionicons name="bulb-outline" size={20} color="#4f46e5" />
            <Text className={`flex-1 text-sm ${muted}`}>
              Rules only pre-fill the category. You still get one look in the Inbox before anything is confirmed, and you can change any payment later in Transactions.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Card className="mb-2 flex-row items-center gap-3 p-3">
            <CategoryTile category={item.category} />
            <View className="flex-1">
              <Text className={`font-inter-sb text-base ${ink}`} numberOfLines={1}>{item.payee_key}</Text>
              <Text className={`text-xs ${muted}`}>Always → {item.category}</Text>
            </View>
            <Pressable onPress={() => confirmDelete(item.id, item.payee_key)} hitSlop={10} className="h-11 w-11 items-center justify-center rounded-full active:opacity-50">
              <Ionicons name="trash-outline" size={20} color="#e11d48" />
            </Pressable>
          </Card>
        )}
      />
    </Screen>
  );
}

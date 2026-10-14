import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, TextInput, View } from 'react-native';
import { useAddRule, useCategoryNames, useDeleteRule, useRules, useTxns } from '../data/hooks';
import { toPayeeKey } from '../parser/extract';
import { Empty, Icon, Input, Pill, SHADOW_SM, Screen, Text, ink, muted } from '../ui/components';
import { categoryMeta } from '../ui/theme';

export default function RulesScreen() {
  const { data, isLoading, error } = useRules();
  const pending = useTxns('pending').data ?? [];
  const categories = useCategoryNames();
  const remove = useDeleteRule();
  const add = useAddRule();
  const [payee, setPayee] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string | null>(null);

  const rules = data ?? [];
  const key = toPayeeKey(payee.trim());
  const canCreate = !!key && !!category;
  const matched = pending.filter((t) => t.type === 'debit' && t.category).length;
  const filterCats = useMemo(() => [...new Set(rules.map((r) => r.category))], [rules]);
  const shown = rules.filter((r) => (!filter || r.category === filter) && (!search.trim() || r.payee_key.includes(search.trim().toLowerCase())));

  const create = () => {
    if (!key || !category) return;
    add.mutate({ payeeKey: key, category }, { onSuccess: () => { setPayee(''); setCategory(null); setPicking(false); } });
  };

  const confirmDelete = (id: string, payeeKey: string) =>
    Alert.alert('Delete rule?', `Future payments to "${payeeKey}" will no longer be sorted automatically.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(id) },
    ]);

  const header = (
    <View className="gap-4 pb-4">
      <View className="gap-1">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-1 flex-row items-center gap-2">
            <Text className={`flex-shrink font-inter-sb text-headline-md ${ink}`} numberOfLines={1}>Automation Rules</Text>
            <View className="rounded-full bg-secondary-container px-2 py-0.5">
              <Text className="font-inter-sb text-label-sm text-on-secondary-container">{rules.length} Active</Text>
            </View>
          </View>
        </View>
        <Text className={`text-body-md ${muted}`}>Automatically pre-fill the category of payments from payees you have sorted before.</Text>
      </View>

      <View style={SHADOW_SM} className="gap-4 rounded-xl bg-surface-container-high p-4">
        <View className="flex-row items-center gap-2">
          <View className="h-7 w-7 items-center justify-center rounded-lg bg-primary-container">
            <Icon name="bolt" size={18} color="#ffffff" />
          </View>
          <Text className={`font-inter-sb text-label-lg ${ink}`}>Rule summary</Text>
        </View>
        <View className="flex-row gap-1">
          {[
            { v: rules.length, l: 'Active Rules', c: 'text-primary' },
            { v: filterCats.length, l: 'Categories', c: ink },
            { v: matched, l: 'Pre-sorted now', c: 'text-secondary' },
          ].map((s) => (
            <View key={s.l} className="flex-1 items-center rounded-lg bg-surface-container-lowest/80 p-2">
              <Text className={`font-inter-b text-headline-md ${s.c}`}>{s.v}</Text>
              <Text className={`mt-0.5 text-label-sm ${muted}`}>{s.l}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={SHADOW_SM} className="h-12 flex-row items-center gap-2 rounded-xl bg-surface-container-lowest px-3.5">
        <Icon name="search" size={20} color="#464555" />
        <TextInput value={search} onChangeText={setSearch} placeholder="Search rules or keywords..." placeholderTextColor="#777587" className={`font-inter flex-1 py-0 text-body-md ${ink}`} />
      </View>
      {filterCats.length > 0 && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[null, ...filterCats]}
          keyExtractor={(c) => c ?? '__all'}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => {
            const on = filter === item;
            const n = item ? rules.filter((r) => r.category === item).length : rules.length;
            return (
              <Pressable onPress={() => setFilter(item)} style={on ? SHADOW_SM : undefined} className={`h-9 items-center justify-center rounded-full px-3.5 ${on ? 'bg-primary' : 'bg-surface-container-low'}`}>
                <Text className={`font-inter-sb text-label-md ${on ? 'text-on-primary' : muted}`}>{item ?? 'All'} ({n})</Text>
              </Pressable>
            );
          }}
        />      )}

      <View style={SHADOW_SM} className="gap-2 rounded-xl bg-surface-container-lowest p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1">
            <Icon name="auto-fix-high" size={20} color="#3525cd" />
            <Text className={`font-inter-sb text-title-md ${ink}`}>Quick Add Rule</Text>
          </View>
        </View>
        <View className="mt-1 gap-1">
          <Text className={`font-inter-md text-label-sm ${muted}`}>When SMS / Payee contains</Text>
          <Input variant="field" className="h-11 rounded-lg" placeholder="e.g. Blinkit, Zomato, Rapido" value={payee} onChangeText={setPayee} autoCapitalize="none" />
        </View>
        <View className="gap-1">
          <Text className={`font-inter-md text-label-sm ${muted}`}>Assign to Category</Text>
          <View className="flex-row flex-wrap items-center gap-2">
            <Pressable onPress={() => setPicking(!picking)} className="flex-row items-center gap-1.5 rounded-lg bg-surface-container-high px-3 py-1.5 active:opacity-70">
              {category ? <View className="h-2 w-2 rounded-full" style={{ backgroundColor: categoryMeta(category).color }} /> : null}
              <Text className="font-inter-sb text-label-md text-primary">{category ?? 'Choose category'}</Text>
              <Icon name="arrow-drop-down" size={16} color="#3525cd" />
            </Pressable>
            <Text className={`text-body-sm ${muted}`}>Auto-applies instantly</Text>
          </View>
          {picking && (
            <View className="mt-1 flex-row flex-wrap gap-1.5">
              {categories.map((c) => (
                <Pressable key={c} onPress={() => { setCategory(c); setPicking(false); }} className={`h-9 flex-row items-center gap-1.5 rounded-full px-3 ${category === c ? 'bg-primary' : 'bg-surface-container-low'}`}>
                  <View className="h-2 w-2 rounded-full" style={{ backgroundColor: categoryMeta(c).color }} />
                  <Text className={`font-inter-md text-label-md ${category === c ? 'text-on-primary' : ink}`}>{c}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
        {add.error && <Text className="text-body-sm text-error">{add.error.message}</Text>}
        <Pressable
          onPress={create}
          disabled={!canCreate || add.isPending}
          className={`mt-1 h-11 flex-row items-center justify-center gap-1 rounded-lg bg-surface-container-high active:opacity-70 ${!canCreate ? 'opacity-50' : ''}`}
        >
          <Icon name="add-circle-outline" size={18} color="#3525cd" />
          <Text className="font-inter-sb text-label-lg text-primary">{add.isPending ? 'Creating…' : 'Create Automation'}</Text>
        </Pressable>
      </View>

      {rules.length > 0 && (
        <View className="flex-row items-center justify-between px-1">
          <Text className={`font-inter-md text-label-md uppercase tracking-wider ${muted}`}>Active Rules ({shown.length})</Text>
        </View>
      )}
    </View>
  );

  return (
    <Screen>
      {error && <Text className="mb-2 text-error">{error.message}</Text>}
      <FlatList
        data={shown}
        keyExtractor={(r) => r.id}
        ListHeaderComponent={header}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View className="h-2" />}
        ListEmptyComponent={isLoading ? <ActivityIndicator /> : <Empty icon="tune" title="No rules yet" hint={'Add one above, or turn on "Always use…" while confirming a payment.'} />}
        ListFooterComponent={
          <View className="mt-4 flex-row items-center gap-3 rounded-xl bg-surface-container-high p-4">
            <Icon name="tips-and-updates" size={24} color="#3525cd" />
            <Text className={`flex-1 text-body-sm ${muted}`}>
              <Text className="font-inter-b">How rules work: </Text>
              rules only pre-fill the category. You still get one look in the Inbox before anything is confirmed, and you can change any payment later in Transactions.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const meta = categoryMeta(item.category);
          return (
            <View style={SHADOW_SM} className="gap-2 rounded-xl bg-surface-container-lowest p-4">
              <View className="flex-row items-start justify-between gap-2">
                <View className="min-w-0 flex-1 pr-2">
                  <Text className={`font-inter-sb text-title-md ${ink}`} numberOfLines={1}>{item.payee_key}</Text>
                  <Text className={`mt-0.5 text-body-sm ${muted}`}>Pre-fills {item.category} on every new payment</Text>
                </View>
                <Pressable onPress={() => confirmDelete(item.id, item.payee_key)} hitSlop={10} className="h-8 w-8 items-center justify-center rounded-full active:bg-error-container">
                  <Icon name="delete-outline" size={20} color="#ba1a1a" />
                </Pressable>
              </View>
              <View className="flex-row flex-wrap items-center gap-1 pt-1">
                <View className="flex-row items-center gap-1 rounded-md bg-surface-container-low px-2.5 py-1">
                  <Icon name="search" size={14} color="#464555" />
                  <Text className={`font-inter-md text-label-md ${ink}`}>Contains </Text>
                  <Text className="font-inter-sb text-label-md text-primary">"{item.payee_key.toUpperCase()}"</Text>
                </View>
                <Icon name="arrow-forward" size={16} color="#777587" />
                <View className="flex-row items-center gap-1.5 rounded-md bg-surface-container-high px-2.5 py-1">
                  <View className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
                  <Text className="font-inter-sb text-label-md text-primary">{item.category}</Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </Screen>
  );
}

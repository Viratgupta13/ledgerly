import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, TextInput, View } from 'react-native';
import { PendingCard } from '../../src/components/PendingCard';
import { useCategoryNames, useNoteSuggestions, useTxns } from '../../src/data/hooks';
import type { TxnRow } from '../../src/data/types';
import { Empty, Icon, Pill, SHADOW_SM, Screen, Text, ink, muted, rupees } from '../../src/ui/components';
import { categoryMeta, tint } from '../../src/ui/theme';

type Range = 'month' | 'last' | 'all';
type Day = { key: string; label: string; subtotal: number; txns: TxnRow[] };

const DAY = 24 * 60 * 60 * 1000;
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

function dayLabel(d: Date, now: Date): string {
  const diff = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / DAY);
  const short = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  if (diff === 0) return `Today, ${short}`;
  if (diff === 1) return `Yesterday, ${short}`;
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
}

export default function TransactionsScreen() {
  const { data, isLoading, error } = useTxns('confirmed');
  const categories = useCategoryNames();
  const suggestions = useNoteSuggestions();
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [range, setRange] = useState<Range>('month');

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const rangeLabel = range === 'all' ? 'All time' : (range === 'month' ? monthStart : lastStart).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  const nextRange: Record<Range, Range> = { month: 'last', last: 'all', all: 'month' };

  const { days, spent, inflow, count, shares } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const inRange = (iso: string) => {
      if (range === 'all') return true;
      const d = new Date(iso);
      const t = range === 'month' ? monthStart : lastStart;
      return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth();
    };
    const list = (data ?? []).filter(
      (t) =>
        inRange(t.occurred_at) &&
        (!category || t.category === category) &&
        (!q || [t.merchant, t.note, t.category, String(t.amount)].some((v) => v?.toLowerCase().includes(q))),
    );

    const out: Day[] = [];
    let spentTotal = 0;
    let inflowTotal = 0;
    const byCat = new Map<string, number>();
    for (const t of list) {
      const d = new Date(t.occurred_at);
      const last = out[out.length - 1];
      if (last && sameDay(new Date(last.txns[0].occurred_at), d)) last.txns.push(t);
      else out.push({ key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, label: dayLabel(d, now), subtotal: 0, txns: [t] });
      if (t.type === 'debit') {
        out[out.length - 1].subtotal += t.amount;
        spentTotal += t.amount;
        const c = t.category ?? 'Uncategorised';
        byCat.set(c, (byCat.get(c) ?? 0) + t.amount);
      } else inflowTotal += t.amount;
    }
    const shares = [...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
    return { days: out, spent: spentTotal, inflow: inflowTotal, count: list.length, shares };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, query, category, range]);

  const usedCategories = useMemo(() => [...new Set((data ?? []).map((t) => t.category).filter((c): c is string => !!c))], [data]);
  const rangeText = range === 'all' ? 'All time' : `${(range === 'month' ? monthStart : lastStart).toLocaleDateString('en-IN', { month: 'short' })} 1 - ${new Date((range === 'month' ? monthStart : lastStart).getFullYear(), (range === 'month' ? monthStart : lastStart).getMonth() + 1, 0).getDate()}`;

  const header = (
    <View className="gap-2 pb-4">
      <View className="flex-row items-center gap-2 pb-1">
        <Text className={`font-inter-sb text-headline-md ${ink}`}>Transactions</Text>
        <View className="rounded-full bg-surface-container-high px-2.5 py-0.5 dark:bg-dk-container">
          <Text className="font-inter-sb text-label-sm text-primary dark:text-dk-primary">{(data ?? []).length} verified</Text>
        </View>
      </View>

      <View style={SHADOW_SM} className="h-11 flex-row items-center gap-2 rounded-xl bg-surface-container-lowest px-3.5 dark:bg-dk-lowest">
        <Icon name="search" size={20} color="#777587" />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search payee, note, or amount..." placeholderTextColor="#777587" className={`font-inter flex-1 py-0 text-body-md ${ink}`} />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10}>
            <Icon name="cancel" size={16} color="#777587" />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={['__all', ...usedCategories]}
        keyExtractor={(c) => c}
        contentContainerStyle={{ gap: 8, paddingVertical: 2, alignItems: 'center' }}
        ListHeaderComponent={
          <Pressable onPress={() => setRange(nextRange[range])} style={SHADOW_SM} className="mr-2 h-9 flex-row items-center gap-1.5 rounded-full bg-surface-container-high px-3.5 active:opacity-70 dark:bg-dk-container">
            <Icon name="calendar-month" size={18} color="#3525cd" />
            <Text className={`font-inter-md text-label-md ${ink}`}>{rangeLabel}</Text>
            <Icon name="arrow-drop-down" size={16} color="#777587" />
          </Pressable>
        }
        renderItem={({ item }) =>
          item === '__all' ? (
            <Pressable onPress={() => setCategory(null)} style={SHADOW_SM} className={`h-9 items-center justify-center rounded-full px-4 ${!category ? 'bg-primary' : 'bg-surface-container-lowest dark:bg-dk-lowest'}`}>
              <Text className={`font-inter-sb text-label-md ${!category ? 'text-on-primary' : ink}`}>All</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => setCategory(category === item ? null : item)} style={SHADOW_SM} className={`h-9 flex-row items-center gap-2 rounded-full px-3.5 ${category === item ? 'bg-primary' : 'bg-surface-container-lowest dark:bg-dk-lowest'}`}>
              <View className="h-2 w-2 rounded-full" style={{ backgroundColor: category === item ? '#6cf8bb' : categoryMeta(item).color }} />
              <Text className={`font-inter-md text-label-md ${category === item ? 'text-on-primary' : ink}`}>{item}</Text>
            </Pressable>
          )
        }
      />

      <View style={SHADOW_SM} className="mt-2 gap-2 overflow-hidden rounded-2xl bg-surface-container-lowest p-4 dark:bg-dk-lowest">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Icon name="account-balance-wallet" size={18} color="#3525cd" />
            <Text className={`font-inter-sb text-label-md ${ink}`}>{range === 'all' ? 'Summary' : 'Monthly Summary'}</Text>
          </View>
          <Text className="text-label-sm text-outline">{rangeText}</Text>
        </View>
        <View className="flex-row items-start justify-between pt-0.5">
          <View>
            <Text style={{ fontVariant: ['tabular-nums'] }} className={`font-inter-b text-headline-sm ${ink}`}>-{rupees(spent)}</Text>
            <Text className="pt-0.5 text-body-sm text-outline">{count} transactions</Text>
          </View>
          <View className="items-end">
            <Text style={{ fontVariant: ['tabular-nums'] }} className="font-inter-b text-headline-sm text-secondary dark:text-dk-secondary">+{rupees(inflow)}</Text>
            <View className="flex-row items-center gap-1 pt-0.5">
              <Icon name="trending-up" size={14} color="#006c49" />
              <Text className="font-inter-md text-body-sm text-secondary dark:text-dk-secondary">Total inflow</Text>
            </View>
          </View>
        </View>
        <View className="mt-1 h-1.5 flex-row gap-0.5 overflow-hidden rounded-full bg-surface-container-high dark:bg-dk-container">
          {shares.map(([name, total]) => (
            <View key={name} className="h-full rounded-full" style={{ flex: total, backgroundColor: categoryMeta(name).color }} />
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <Screen tab={2}>
      {error && <Text className="mb-2 text-error">{error.message}</Text>}
      <FlatList
        data={days}
        keyExtractor={(d) => d.key}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        initialNumToRender={6}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View className="h-6" />}
        ListHeaderComponent={header}
        ListEmptyComponent={isLoading ? <ActivityIndicator /> : <Empty icon="receipt-long" title="Nothing here" hint="Confirmed payments that match your filters show up here." />}
        renderItem={({ item: day }) => (
          <View className="gap-2">
            <View className="flex-row items-center justify-between px-1">
              <Text className={`font-inter-sb text-label-md ${ink}`}>{day.label}</Text>
              {day.subtotal > 0 && <Text className="font-inter-md text-label-sm text-outline">Subtotal: -{rupees(day.subtotal)}</Text>}
            </View>
            <View style={SHADOW_SM} className="overflow-hidden rounded-2xl bg-surface-container-lowest dark:bg-dk-lowest">
              {day.txns.map((t, idx) => {
                const isDebit = t.type === 'debit';
                const meta = categoryMeta(t.category);
                if (editing === t.id) {
                  return (
                    <View key={t.id} className="p-2">
                      <PendingCard txn={t} categories={categories} suggestions={suggestions} mode="edit" onDone={() => setEditing(null)} />
                    </View>
                  );
                }
                return (
                  <View key={t.id}>
                    {idx > 0 && <View className="ml-16 mr-3.5 h-px bg-surface-container-low dark:bg-dk-container" />}
                    <Pressable disabled={!isDebit} onPress={() => setEditing(t.id)} className="flex-row items-center justify-between p-3.5 active:bg-surface-container-low">
                      <View className="flex-1 flex-row items-center gap-3">
                        <View className="h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: isDebit ? tint(meta.color, 0.1) : '#6cf8bb' }}>
                          <Icon name={isDebit ? meta.icon : 'payments'} size={20} color={isDebit ? meta.iconColor : '#00714d'} />
                        </View>
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2">
                            <Text className={`flex-shrink font-inter-sb text-title-md ${ink}`} numberOfLines={1}>{t.merchant ?? 'Unknown'}</Text>
                            {isDebit && t.category ? <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} /> : null}
                            {!isDebit ? <Pill label="Inflow" tone="success" className="px-1.5 py-0.5" /> : null}
                          </View>
                          <Text className="text-body-sm text-outline" numberOfLines={1}>
                            {[t.category, t.note, new Date(t.occurred_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })].filter(Boolean).join(' • ')}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end pl-2">
                        <Text style={{ fontVariant: ['tabular-nums'] }} className={`font-inter-b text-title-md tracking-tight ${isDebit ? ink : 'text-secondary dark:text-dk-secondary'}`}>
                          {isDebit ? '-' : '+'}{rupees(t.amount)}
                        </Text>
                        <View className="flex-row items-center gap-1">
                          <Icon name="check-circle" size={13} color="#006c49" />
                          <Text className="font-inter-md text-[11px] text-secondary dark:text-dk-secondary">{isDebit ? (t.category ? 'Categorized' : 'Confirmed') : 'Deposited'}</Text>
                        </View>
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      />
    </Screen>
  );
}

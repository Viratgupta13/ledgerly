import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';
import { PendingCard } from '../../src/components/PendingCard';
import { useCategoryNames, useNoteSuggestions, useTxns } from '../../src/data/hooks';
import type { TxnRow } from '../../src/data/types';
import { Amount, Card, CategoryTile, Chip, Empty, Pill, Screen, Text, ink, muted, rupees } from '../../src/ui/components';
import { categoryColor, tint } from '../../src/ui/theme';

type Range = 'month' | 'last' | 'all';
type Row = { kind: 'header'; key: string; label: string; subtotal: number } | { kind: 'txn'; key: string; txn: TxnRow };

const DAY = 24 * 60 * 60 * 1000;
const WEEKDAY = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

function dayLabel(d: Date, now: Date): string {
  const diff = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()) / DAY);
  const short = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  if (diff === 0) return `Today, ${short}`;
  if (diff === 1) return `Yesterday, ${short}`;
  return WEEKDAY(d);
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
  const { rows, spent, inflow, count } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const inRange = (iso: string) => {
      if (range === 'all') return true;
      const d = new Date(iso);
      const target = range === 'month' ? new Date(now.getFullYear(), now.getMonth(), 1) : new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth();
    };
    const list = (data ?? []).filter(
      (t) =>
        inRange(t.occurred_at) &&
        (!category || t.category === category) &&
        (!q || [t.merchant, t.note, t.category, String(t.amount)].some((v) => v?.toLowerCase().includes(q))),
    );

    const out: Row[] = [];
    let current = '';
    let spentTotal = 0;
    let inflowTotal = 0;
    for (const t of list) {
      const d = new Date(t.occurred_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (key !== current) {
        current = key;
        const dayDebits = list
          .filter((x) => {
            const xd = new Date(x.occurred_at);
            return `${xd.getFullYear()}-${xd.getMonth()}-${xd.getDate()}` === key && x.type === 'debit';
          })
          .reduce((n, x) => n + x.amount, 0);
        out.push({ kind: 'header', key: `h-${key}`, label: dayLabel(d, now), subtotal: dayDebits });
      }
      out.push({ kind: 'txn', key: t.id, txn: t });
      if (t.type === 'debit') spentTotal += t.amount;
      else inflowTotal += t.amount;
    }
    return { rows: out, spent: spentTotal, inflow: inflowTotal, count: list.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, query, category, range]);

  const usedCategories = useMemo(() => [...new Set((data ?? []).map((t) => t.category).filter((c): c is string => !!c))], [data]);

  const header = (
    <View className="mb-2 gap-3">
      <View className="min-h-[52px] flex-row items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900">
        <Ionicons name="search" size={20} color="#64748b" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search payee, note, or amount…"
          placeholderTextColor="#94a3b8"
          className={`font-inter flex-1 py-3 text-base ${ink}`}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color="#94a3b8" />
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {(['month', 'last', 'all'] as const).map((r) => (
          <Chip key={r} label={r === 'month' ? 'This month' : r === 'last' ? 'Last month' : 'All time'} selected={range === r} onPress={() => setRange(r)} />
        ))}
        <View className="mx-1 w-px self-stretch bg-slate-200 dark:bg-slate-700" />
        <Chip label="All" selected={!category} onPress={() => setCategory(null)} />
        {usedCategories.map((c) => (
          <Chip key={c} label={c} dot={categoryColor(c)} selected={category === c} onPress={() => setCategory(category === c ? null : c)} />
        ))}
      </ScrollView>

      <Card className="p-4">
        <View className="flex-row items-end justify-between">
          <View>
            <Text className={`text-xs ${muted}`}>{range === 'month' ? 'This month' : range === 'last' ? 'Last month' : 'All time'}</Text>
            <Text style={{ fontVariant: ['tabular-nums'] }} className={`font-inter-b text-2xl ${ink}`}>-{rupees(spent)}</Text>
            <Text className={`text-xs ${muted}`}>{count} {count === 1 ? 'transaction' : 'transactions'}</Text>
          </View>
          <View className="items-end">
            <Text className={`text-xs ${muted}`}>Total inflow</Text>
            <Text style={{ fontVariant: ['tabular-nums'] }} className="font-inter-b text-xl text-emerald-600">+{rupees(inflow)}</Text>
          </View>
        </View>
      </Card>
    </View>
  );

  return (
    <Screen title="Transactions" right={<Pill label={`${(data ?? []).length} verified`} />}>
      {error && <Text className="mb-2 text-rose-600">{error.message}</Text>}
      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={false}
        initialNumToRender={12}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={header}
        ListEmptyComponent={
          isLoading ? <ActivityIndicator className="mt-8" /> : <Empty icon="receipt-outline" title="Nothing here" hint="Confirmed payments that match your filters show up here." />
        }
        renderItem={({ item }) => {
          if (item.kind === 'header') {
            return (
              <View className="mb-1.5 mt-3 flex-row items-center justify-between px-1">
                <Text className={`font-inter-sb text-sm ${ink}`}>{item.label}</Text>
                {item.subtotal > 0 && <Text className={`text-xs ${muted}`}>Subtotal: -{rupees(item.subtotal)}</Text>}
              </View>
            );
          }
          const t = item.txn;
          if (editing === t.id) {
            return <PendingCard txn={t} categories={categories} suggestions={suggestions} mode="edit" onDone={() => setEditing(null)} />;
          }
          const isDebit = t.type === 'debit';
          return (
            <Pressable disabled={!isDebit} onPress={() => setEditing(t.id)} className="mb-2 active:opacity-60">
              <Card className="flex-row items-center gap-3 p-3">
                {isDebit ? (
                  <CategoryTile category={t.category} />
                ) : (
                  <View className="h-10 w-10 items-center justify-center rounded-[10px]" style={{ backgroundColor: tint('#10B981', 0.15) }}>
                    <Ionicons name="cash-outline" size={20} color="#10B981" />
                  </View>
                )}
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className={`flex-shrink font-inter-sb text-base ${ink}`} numberOfLines={1}>{t.merchant ?? 'Unknown'}</Text>
                    {t.category ? (
                      <View className="rounded-md px-1.5 py-0.5" style={{ backgroundColor: tint(categoryColor(t.category), 0.14) }}>
                        <Text className="font-inter-md text-[10px]" style={{ color: categoryColor(t.category) }}>{t.category}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text className={`text-xs ${muted}`} numberOfLines={1}>
                    {[t.note, new Date(t.occurred_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Amount value={t.amount} type={t.type} className="text-base" />
              </Card>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useTxns } from '../../src/data/hooks';
import { breakdown, type Period } from '../../src/reports/breakdown';
import { Card, Empty, ProgressBar, Screen, SectionLabel, Text, ink, muted, rupees, CategoryTile } from '../../src/ui/components';
import { categoryColor } from '../../src/ui/theme';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const SHORT = MONTHS.map((m) => m.slice(0, 3));

function Money({ value, className = '' }: { value: number; className?: string }) {
  const [whole, dec] = value.toFixed(2).split('.');
  return (
    <Text style={{ fontVariant: ['tabular-nums'] }} className={`font-inter-b ${className}`}>
      ₹{Number(whole).toLocaleString('en-IN')}
      <Text className="font-inter text-xl opacity-60">.{dec}</Text>
    </Text>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { data, isLoading, error } = useTxns('confirmed');
  const toReview = useTxns('pending').data?.length ?? 0;
  const now = new Date();
  const [period, setPeriod] = useState<Period>({ year: now.getFullYear(), month: now.getMonth() });
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const allTime = period === 'all';
  const report = breakdown(data ?? [], period);

  const shift = (delta: number) => {
    if (period === 'all') return;
    const d = new Date(period.year, period.month + delta, 1);
    setPeriod({ year: d.getFullYear(), month: d.getMonth() });
    setOpenCat(null);
    setOpenGroup(null);
  };

  // Month-only numbers: change vs the month before, and spend per day.
  let delta: number | null = null;
  let dailyAverage: number | null = null;
  if (period !== 'all') {
    const prev = new Date(period.year, period.month - 1, 1);
    const before = breakdown(data ?? [], { year: prev.getFullYear(), month: prev.getMonth() }).total;
    if (before > 0) delta = Math.round(((report.total - before) / before) * 100);
    const isCurrent = period.year === now.getFullYear() && period.month === now.getMonth();
    const days = isCurrent ? now.getDate() : new Date(period.year, period.month + 1, 0).getDate();
    dailyAverage = report.total / days;
  }
  const prevLabel = period !== 'all' ? SHORT[(period.month + 11) % 12] : '';
  const txnCount = report.categories.reduce((n, c) => n + c.count, 0);

  // Stacked bar: the five biggest categories, everything else folded into one slate segment.
  const top = report.categories.slice(0, 5);
  const rest = report.categories.slice(5).reduce((n, c) => n + c.total, 0);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="mb-3 mt-1 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Pressable onPress={() => shift(-1)} disabled={allTime} hitSlop={10} className="h-11 w-9 items-center justify-center active:opacity-50">
              <Ionicons name="chevron-back" size={22} color={allTime ? '#c7c4d8' : '#3525cd'} />
            </Pressable>
            <View>
              <Text className={`font-inter-sb text-lg ${ink}`}>{allTime ? 'All time' : MONTHS[period.month]}</Text>
              {!allTime && <Text className={`text-xs ${muted}`}>{period.year}</Text>}
            </View>
            <Pressable onPress={() => shift(1)} disabled={allTime} hitSlop={10} className="h-11 w-9 items-center justify-center active:opacity-50">
              <Ionicons name="chevron-forward" size={22} color={allTime ? '#c7c4d8' : '#3525cd'} />
            </Pressable>
          </View>
          <View className="flex-row rounded-full bg-surface-container p-1 dark:bg-dk-container">
            {(['month', 'all'] as const).map((k) => {
              const active = (k === 'all') === allTime;
              return (
                <Pressable
                  key={k}
                  onPress={() => setPeriod(k === 'all' ? 'all' : { year: now.getFullYear(), month: now.getMonth() })}
                  className={`min-h-9 justify-center rounded-full px-4 ${active ? 'bg-primary' : ''}`}
                >
                  <Text className={`font-inter-sb text-xs ${active ? 'text-white' : ink}`}>{k === 'month' ? 'By month' : 'All time'}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mb-4 overflow-hidden rounded-[20px] bg-primary p-5">
          <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-container opacity-60" />
          <View className="flex-row items-center justify-between">
            <Text className="font-inter-md text-xs uppercase tracking-wider text-on-primary-container">{allTime ? 'Total spent' : `Spent in ${MONTHS[period.month]}`}</Text>
            {delta !== null && (
              <View className="flex-row items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
                <Ionicons name={delta <= 0 ? 'trending-down' : 'trending-up'} size={14} color="#fff" />
                <Text className="font-inter-md text-xs text-white">{delta > 0 ? '+' : ''}{delta}% vs {prevLabel}</Text>
              </View>
            )}
          </View>
          <Money value={report.total} className="mt-2 text-4xl text-white" />
          <Text className="mt-1 text-sm text-on-primary-container">Across {txnCount} confirmed {txnCount === 1 ? 'payment' : 'payments'}</Text>
          <View className="mt-4 flex-row gap-3">
            <View className="flex-1 rounded-xl bg-white/15 p-3">
              <Text className="font-inter-md text-[10px] uppercase tracking-wider text-on-primary-container">{dailyAverage === null ? 'Payments' : 'Daily average'}</Text>
              <Text style={{ fontVariant: ['tabular-nums'] }} className="mt-0.5 font-inter-sb text-base text-white">
                {dailyAverage === null ? txnCount : rupees(dailyAverage)}
              </Text>
            </View>
            <Pressable onPress={() => router.navigate('/inbox')} className="flex-1 rounded-xl bg-white/15 p-3 active:opacity-70">
              <Text className="font-inter-md text-[10px] uppercase tracking-wider text-on-primary-container">To review</Text>
              <Text className="mt-0.5 font-inter-sb text-base text-white">{toReview} {toReview === 1 ? 'payment' : 'payments'}</Text>
            </Pressable>
          </View>
        </View>

        {isLoading && <ActivityIndicator className="mt-6" />}
        {error && <Text className="mb-2 text-error">{error.message}</Text>}
        {!isLoading && report.categories.length === 0 && (
          <Empty icon="pie-chart-outline" title="No spending to show" hint={allTime ? 'Confirm payments in the Inbox to see them here.' : 'Nothing confirmed this month. Try "All time".'} />
        )}

        {report.categories.length > 0 && (
          <Card className="mb-4 p-4">
            <View className="flex-row items-center justify-between">
              <Text className={`font-inter-sb text-base ${ink}`}>Spending distribution</Text>
              <Text className={`text-xs ${muted}`}>{report.categories.length} categories</Text>
            </View>
            <View className="mt-3 h-2.5 flex-row overflow-hidden rounded-full bg-surface-container dark:bg-dk-container">
              {top.map((c) => (
                <View key={c.name} style={{ flex: c.total, backgroundColor: categoryColor(c.name) }} />
              ))}
              {rest > 0 && <View style={{ flex: rest, backgroundColor: '#777587' }} />}
            </View>
            <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1.5">
              {top.map((c) => (
                <View key={c.name} className="flex-row items-center gap-1.5">
                  <View className="h-2 w-2 rounded-full" style={{ backgroundColor: categoryColor(c.name) }} />
                  <Text className={`text-xs ${muted}`}>{c.name} ({Math.round((c.total / report.total) * 100)}%)</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {report.categories.length > 0 && (
          <View className="mb-2 flex-row items-end justify-between px-1">
            <Text className={`font-inter-b text-xl ${ink}`}>Categories</Text>
            <Text className={`text-xs ${muted}`}>Sorted by amount</Text>
          </View>
        )}

        {report.categories.map((c) => {
          const color = categoryColor(c.name);
          const open = openCat === c.name;
          return (
            <Card key={c.name} className="mb-3 overflow-hidden">
              <Pressable className="p-4 active:opacity-60" onPress={() => setOpenCat(open ? null : c.name)}>
                <View className="flex-row items-center gap-3">
                  <CategoryTile category={c.name} />
                  <View className="flex-1">
                    <Text className={`font-inter-sb text-base ${ink}`}>{c.name}</Text>
                    <Text className={`text-xs ${muted}`}>{c.count} {c.count === 1 ? 'payment' : 'payments'}</Text>
                  </View>
                  <View className="items-end">
                    <Text style={{ fontVariant: ['tabular-nums'] }} className={`font-inter-sb text-base ${ink}`}>{rupees(c.total)}</Text>
                    <Text className={`text-xs ${muted}`}>{Math.round((c.total / report.total) * 100)}% of total</Text>
                  </View>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#777587" />
                </View>
                <View className="mt-3">
                  <ProgressBar share={c.total / report.total} color={color} />
                </View>
              </Pressable>

              {open && (
                <View className="px-4 pb-4">
                  <SectionLabel>Top payees</SectionLabel>
                  {c.merchants.map((m) => {
                    const id = `${c.name}:${m.key}`;
                    const expanded = openGroup === id;
                    return (
                      <View key={m.key} className="mt-2 overflow-hidden rounded-xl bg-surface dark:bg-dk-surface">
                        <Pressable className="min-h-14 flex-row items-center gap-3 px-3 py-2 active:opacity-60" onPress={() => setOpenGroup(expanded ? null : id)}>
                          <View className="h-9 w-9 items-center justify-center rounded-lg bg-surface-container-lowest dark:bg-dk-container">
                            <Text className={`font-inter-sb ${ink}`}>{m.label.trim().charAt(0).toUpperCase()}</Text>
                          </View>
                          <View className="flex-1">
                            <Text className={`font-inter-sb ${ink}`} numberOfLines={1}>{m.label}</Text>
                            <Text className={`text-xs ${muted}`}>{m.count} {m.count === 1 ? 'payment' : 'payments'}</Text>
                          </View>
                          <Text style={{ fontVariant: ['tabular-nums'] }} className={`font-inter-sb ${ink}`}>{rupees(m.total)}</Text>
                          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#777587" />
                        </Pressable>
                        {expanded && m.items.map((i) => (
                          <View key={i.id} className="flex-row items-center justify-between border-t border-surface-container-high px-3 py-2.5 dark:border-dk-container">
                            <View className="flex-1 pr-3">
                              <Text className={`text-sm ${ink}`} numberOfLines={1}>{i.who}</Text>
                              <Text className={`text-xs ${muted}`} numberOfLines={1}>
                                {[i.note, new Date(i.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })].filter(Boolean).join(' · ')}
                              </Text>
                            </View>
                            <Text style={{ fontVariant: ['tabular-nums'] }} className={`text-sm ${ink}`}>-{rupees(i.amount)}</Text>
                          </View>
                        ))}
                      </View>
                    );
                  })}
                </View>
              )}
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

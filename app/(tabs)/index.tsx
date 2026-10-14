import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useTxns } from '../../src/data/hooks';
import { breakdown, type Period } from '../../src/reports/breakdown';
import { Card, Chip, Empty, Screen, ink, muted, rupees } from '../../src/ui/components';
import { categoryColor } from '../../src/ui/theme';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function HomeScreen() {
  const { data, isLoading, error } = useTxns('confirmed');
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

  return (
    <Screen title="Home">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="mb-3 flex-row items-center justify-between">
          <Pressable onPress={() => shift(-1)} disabled={allTime} hitSlop={10} className="h-11 w-11 items-center justify-center rounded-full active:opacity-50">
            <Ionicons name="chevron-back" size={22} color={allTime ? '#cbd5e1' : '#6366f1'} />
          </Pressable>
          <Text className={`text-base font-semibold ${ink}`}>{allTime ? 'All time' : `${MONTHS[period.month]} ${period.year}`}</Text>
          <Pressable onPress={() => shift(1)} disabled={allTime} hitSlop={10} className="h-11 w-11 items-center justify-center rounded-full active:opacity-50">
            <Ionicons name="chevron-forward" size={22} color={allTime ? '#cbd5e1' : '#6366f1'} />
          </Pressable>
        </View>

        <View className="mb-4 rounded-3xl bg-indigo-600 p-5">
          <Text className="text-indigo-100">{allTime ? 'Total spent' : `Spent in ${MONTHS[period.month]}`}</Text>
          <Text className="mt-1 text-4xl font-bold text-white">{rupees(report.total)}</Text>
          <View className="mt-3 flex-row">
            <Chip label={allTime ? 'Show by month' : 'Show all time'} onPress={() => setPeriod(allTime ? { year: now.getFullYear(), month: now.getMonth() } : 'all')} />
          </View>
        </View>

        {isLoading && <ActivityIndicator className="mt-6" />}
        {error && <Text className="mb-2 text-rose-600">{error.message}</Text>}
        {!isLoading && report.categories.length === 0 && (
          <Empty icon="pie-chart-outline" title="No spending to show" hint={allTime ? 'Confirm payments in the Inbox to see them here.' : 'Nothing confirmed this month. Try "Show all time".'} />
        )}

        {report.categories.map((c) => {
          const share = report.total > 0 ? Math.max(0.04, c.total / report.total) : 0;
          const color = categoryColor(c.name);
          return (
            <Card key={c.name} className="mb-3 overflow-hidden">
              <Pressable className="p-4 active:opacity-60" onPress={() => setOpenCat(openCat === c.name ? null : c.name)}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                    <View>
                      <Text className={`text-base font-semibold ${ink}`}>{c.name}</Text>
                      <Text className={`text-xs ${muted}`}>{c.count} payments</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Text className={`font-semibold ${ink}`}>{rupees(c.total)}</Text>
                    <Ionicons name={openCat === c.name ? 'chevron-up' : 'chevron-down'} size={16} color="#94a3b8" />
                  </View>
                </View>
                <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <View className="h-1.5 rounded-full" style={{ width: `${share * 100}%`, backgroundColor: color }} />
                </View>
              </Pressable>

              {openCat === c.name && c.merchants.map((m) => {
                const id = `${c.name}:${m.key}`;
                return (
                  <View key={m.key} className="border-t border-slate-200 dark:border-slate-800">
                    <Pressable className="min-h-12 flex-row items-center justify-between px-4 py-3 active:opacity-60" onPress={() => setOpenGroup(openGroup === id ? null : id)}>
                      <Text className={`flex-1 pr-3 ${ink}`} numberOfLines={1}>{m.label}</Text>
                      <Text className={muted}>{rupees(m.total)} · {m.count}x</Text>
                    </Pressable>
                    {openGroup === id && m.items.map((i) => (
                      <View key={i.id} className="flex-row items-center justify-between bg-slate-50 px-6 py-2 dark:bg-slate-950">
                        <View className="flex-1 pr-3">
                          <Text className={`text-sm ${ink}`} numberOfLines={1}>{i.who}</Text>
                          <Text className={`text-xs ${muted}`} numberOfLines={1}>
                            {[i.note, new Date(i.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })].filter(Boolean).join(' · ')}
                          </Text>
                        </View>
                        <Text className={`text-sm ${ink}`}>{rupees(i.amount)}</Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </Card>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

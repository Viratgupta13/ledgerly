import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { rupees } from '../../src/components/PendingCard';
import { useTxns } from '../../src/data/hooks';
import { breakdown, type Period } from '../../src/reports/breakdown';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function HomeScreen() {
  const { data, isLoading, error } = useTxns('confirmed');
  const now = new Date();
  const [period, setPeriod] = useState<Period>({ year: now.getFullYear(), month: now.getMonth() });
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const shift = (delta: number) => {
    if (period === 'all') return;
    const d = new Date(period.year, period.month + delta, 1);
    setPeriod({ year: d.getFullYear(), month: d.getMonth() });
    setOpenCat(null);
    setOpenGroup(null);
  };
  const report = breakdown(data ?? [], period);
  const allTime = period === 'all';

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-12 dark:bg-black" contentContainerClassName="pb-8">
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => shift(-1)} disabled={allTime} className="px-3 py-2">
          <Text className={`text-2xl ${allTime ? 'text-gray-300' : 'text-blue-600'}`}>‹</Text>
        </Pressable>
        <Text className="text-lg font-semibold text-black dark:text-white">
          {allTime ? 'All time' : `${MONTHS[period.month]} ${period.year}`}
        </Text>
        <Pressable onPress={() => shift(1)} disabled={allTime} className="px-3 py-2">
          <Text className={`text-2xl ${allTime ? 'text-gray-300' : 'text-blue-600'}`}>›</Text>
        </Pressable>
      </View>
      <Pressable
        className="mt-1 self-center rounded-full border border-gray-300 px-3 py-1 dark:border-gray-700"
        onPress={() => setPeriod(allTime ? { year: now.getFullYear(), month: now.getMonth() } : 'all')}
      >
        <Text className="text-sm text-black dark:text-white">{allTime ? 'Show by month' : 'Show all time'}</Text>
      </Pressable>

      <Text className="mt-4 text-sm text-gray-500">Spent</Text>
      <Text className="text-3xl font-bold text-black dark:text-white">{rupees(report.total)}</Text>

      {isLoading && <ActivityIndicator className="mt-6" />}
      {error && <Text className="mt-3 text-red-600">{error.message}</Text>}
      {!isLoading && report.categories.length === 0 && (
        <Text className="mt-6 text-gray-500">
          No confirmed spending {allTime ? 'yet' : 'in this month'}. Confirmed payments from other months show under "Show all time".
        </Text>
      )}

      {report.categories.map((c) => (
        <View key={c.name} className="mt-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <Pressable className="flex-row items-center justify-between p-4" onPress={() => setOpenCat(openCat === c.name ? null : c.name)}>
            <View>
              <Text className="text-base font-semibold text-black dark:text-white">{c.name}</Text>
              <Text className="text-xs text-gray-500">{c.count} transactions</Text>
            </View>
            <Text className="font-semibold text-black dark:text-white">{rupees(c.total)}</Text>
          </Pressable>

          {openCat === c.name && c.merchants.map((m) => {
            const id = `${c.name}:${m.key}`;
            return (
              <View key={m.key} className="border-t border-gray-200 dark:border-gray-800">
                <Pressable className="flex-row items-center justify-between px-4 py-3" onPress={() => setOpenGroup(openGroup === id ? null : id)}>
                  <Text className="flex-1 pr-3 text-black dark:text-white" numberOfLines={1}>{m.label}</Text>
                  <Text className="text-gray-600 dark:text-gray-300">{rupees(m.total)} · {m.count}x</Text>
                </Pressable>
                {openGroup === id && m.items.map((i) => (
                  <View key={i.id} className="flex-row items-center justify-between bg-gray-50 px-6 py-2 dark:bg-gray-900">
                    <View className="flex-1 pr-3">
                      <Text className="text-sm text-black dark:text-white" numberOfLines={1}>{i.who}</Text>
                      <Text className="text-xs text-gray-500" numberOfLines={1}>
                        {[i.note, new Date(i.date).toLocaleDateString('en-IN')].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                    <Text className="text-sm text-gray-600 dark:text-gray-300">{rupees(i.amount)}</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { rupees } from '../../src/components/PendingCard';
import { useTxns } from '../../src/data/hooks';
import { breakdownForMonth } from '../../src/reports/breakdown';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function HomeScreen() {
  const { data, isLoading, error } = useTxns('confirmed');
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [open, setOpen] = useState<string | null>(null);

  const shift = (delta: number) => {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
    setOpen(null);
  };
  const report = breakdownForMonth(data ?? [], cursor.year, cursor.month);

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-12 dark:bg-black" contentContainerClassName="pb-8">
      <View className="flex-row items-center justify-between">
        <Pressable onPress={() => shift(-1)} className="px-3 py-2"><Text className="text-2xl text-blue-600">‹</Text></Pressable>
        <Text className="text-lg font-semibold text-black dark:text-white">{MONTHS[cursor.month]} {cursor.year}</Text>
        <Pressable onPress={() => shift(1)} className="px-3 py-2"><Text className="text-2xl text-blue-600">›</Text></Pressable>
      </View>

      <Text className="mt-4 text-sm text-gray-500">Spent</Text>
      <Text className="text-3xl font-bold text-black dark:text-white">{rupees(report.total)}</Text>

      {isLoading && <ActivityIndicator className="mt-6" />}
      {error && <Text className="mt-3 text-red-600">{error.message}</Text>}
      {!isLoading && report.categories.length === 0 && (
        <Text className="mt-6 text-gray-500">No confirmed spending this month. Review your SMS in the Inbox tab.</Text>
      )}

      {report.categories.map((c) => (
        <View key={c.name} className="mt-4 rounded-xl border border-gray-200 dark:border-gray-800">
          <Pressable className="flex-row items-center justify-between p-4" onPress={() => setOpen(open === c.name ? null : c.name)}>
            <View>
              <Text className="text-base font-semibold text-black dark:text-white">{c.name}</Text>
              <Text className="text-xs text-gray-500">{c.count} transactions</Text>
            </View>
            <Text className="font-semibold text-black dark:text-white">{rupees(c.total)}</Text>
          </Pressable>
          {open === c.name && c.merchants.map((m) => (
            <View key={m.key} className="flex-row items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-800">
              <Text className="flex-1 pr-3 text-black dark:text-white" numberOfLines={1}>{m.label}</Text>
              <Text className="text-gray-600 dark:text-gray-300">{rupees(m.total)} · {m.count}x</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

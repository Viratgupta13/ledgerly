import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { groupBatch, type PayeeGroup } from '../data/batch';
import { useCategoryNames, useConfirmBatch } from '../data/hooks';
import type { TxnRow } from '../data/types';
import { rupees } from './PendingCard';

type Props = { visible: boolean; txns: TxnRow[]; onClose: () => void };

function CategoryChips({ categories, current, onPick }: { categories: string[]; current: string; onPick: (c: string) => void }) {
  return (
    <View className="mt-2 flex-row flex-wrap gap-2">
      {categories.map((c) => (
        <Pressable
          key={c}
          onPress={() => onPick(c)}
          className={`rounded-full border px-3 py-1 ${c === current ? 'border-blue-600 bg-blue-600' : 'border-gray-300 dark:border-gray-700'}`}
        >
          <Text className={c === current ? 'text-white' : 'text-black dark:text-white'}>{c}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/**
 * Preview of everything "Review & confirm" will save: category, then one row per payee
 * ("Blinkit · 12 payments"), expandable to the individual payments. Categories can be changed
 * and payments removed for a whole payee or one payment at a time.
 */
export function ConfirmBatchModal({ visible, txns, onClose }: Props) {
  const categories = useCategoryNames();
  const confirm = useConfirmBatch();
  const [overrides, setOverrides] = useState<Map<string, string>>(new Map());
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [changing, setChanging] = useState<string | null>(null);

  const groups = useMemo(() => groupBatch(txns, overrides, excluded), [txns, overrides, excluded]);
  const count = groups.reduce((n, g) => n + g.count, 0);
  const total = groups.reduce((n, g) => n + g.total, 0);

  const close = () => {
    setOverrides(new Map());
    setExcluded(new Set());
    setExpanded(null);
    setChanging(null);
    confirm.reset();
    onClose();
  };

  const setCategory = (ids: string[], category: string) => {
    const next = new Map(overrides);
    for (const id of ids) next.set(id, category);
    setOverrides(next);
    setChanging(null);
  };
  const remove = (ids: string[]) => setExcluded(new Set([...excluded, ...ids]));

  const submit = () =>
    confirm.mutate(
      groups.flatMap((g) => g.payees.flatMap((p) => p.items.map((i) => ({ id: i.id, category: g.category })))),
      { onSuccess: close },
    );

  const renderPayee = (category: string, p: PayeeGroup) => {
    const id = `${category}:${p.key}`;
    const ids = p.items.map((i) => i.id);
    const open = expanded === id;
    return (
      <View key={id} className="border-t border-gray-200 dark:border-gray-800">
        <Pressable className="px-4 py-3" onPress={() => setExpanded(open ? null : id)}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-black dark:text-white" numberOfLines={1}>{p.label}</Text>
              <Text className="text-xs text-gray-500">
                {p.items.length} {p.items.length === 1 ? 'payment' : 'payments'} · {open ? 'tap to hide' : 'tap to see each'}
              </Text>
            </View>
            <Text className="text-gray-700 dark:text-gray-200">{rupees(p.total)}</Text>
          </View>
          <View className="mt-2 flex-row gap-4">
            <Pressable onPress={() => setChanging(changing === `p:${id}` ? null : `p:${id}`)}>
              <Text className="text-sm text-blue-600">Change category{p.items.length > 1 ? ' (all)' : ''}</Text>
            </Pressable>
            <Pressable onPress={() => remove(ids)}>
              <Text className="text-sm text-red-600">Remove{p.items.length > 1 ? ' all' : ''}</Text>
            </Pressable>
          </View>
        </Pressable>
        {changing === `p:${id}` && (
          <View className="px-4 pb-3">
            <CategoryChips categories={categories} current={category} onPick={(c) => setCategory(ids, c)} />
          </View>
        )}

        {open && p.items.map((i) => (
          <View key={i.id} className="bg-gray-50 px-6 py-2 dark:bg-gray-900">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-black dark:text-white">{new Date(i.occurred_at).toLocaleDateString('en-IN')}</Text>
              <Text className="text-sm text-gray-700 dark:text-gray-200">{rupees(i.amount)}</Text>
            </View>
            <View className="mt-1 flex-row gap-4">
              <Pressable onPress={() => setChanging(changing === `i:${i.id}` ? null : `i:${i.id}`)}>
                <Text className="text-sm text-blue-600">Change category</Text>
              </Pressable>
              <Pressable onPress={() => remove([i.id])}>
                <Text className="text-sm text-red-600">Remove</Text>
              </Pressable>
            </View>
            {changing === `i:${i.id}` && (
              <CategoryChips categories={categories} current={category} onPick={(c) => setCategory([i.id], c)} />
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View className="flex-1 bg-white pt-10 dark:bg-black">
        <View className="px-4 pb-3">
          <Text className="text-xl font-bold text-black dark:text-white">Confirm {count} payments</Text>
          <Text className="text-gray-500">{rupees(total)} in total. Check the sorting, fix anything wrong, then confirm.</Text>
        </View>

        <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
          {groups.length === 0 && <Text className="mt-6 text-gray-500">Nothing left to confirm.</Text>}
          {groups.map((g) => (
            <View key={g.category} className="mb-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <View className="flex-row items-center justify-between px-4 py-3">
                <View>
                  <Text className="text-base font-semibold text-black dark:text-white">{g.category}</Text>
                  <Text className="text-xs text-gray-500">{g.count} payments · {g.payees.length} payees</Text>
                </View>
                <Text className="font-semibold text-black dark:text-white">{rupees(g.total)}</Text>
              </View>
              {g.payees.map((p) => renderPayee(g.category, p))}
            </View>
          ))}
        </ScrollView>

        {confirm.error && <Text className="px-4 pb-2 text-red-600">{confirm.error.message}</Text>}
        <View className="flex-row gap-3 border-t border-gray-200 px-4 py-4 dark:border-gray-800">
          <Pressable
            className={`flex-1 items-center rounded-lg py-3 ${count === 0 || confirm.isPending ? 'bg-blue-300' : 'bg-blue-600'}`}
            onPress={submit}
            disabled={count === 0 || confirm.isPending}
          >
            <Text className="font-semibold text-white">{confirm.isPending ? 'Saving…' : `Confirm ${count}`}</Text>
          </Pressable>
          <Pressable className="flex-1 items-center rounded-lg border border-gray-300 py-3 dark:border-gray-700" onPress={close}>
            <Text className="font-semibold text-black dark:text-white">Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

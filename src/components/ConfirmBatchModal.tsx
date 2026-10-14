import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { groupBatch } from '../data/batch';
import { useCategoryNames, useConfirmBatch } from '../data/hooks';
import type { TxnRow } from '../data/types';
import { rupees } from './PendingCard';

type Props = { visible: boolean; txns: TxnRow[]; onClose: () => void };

/** Preview of everything "Confirm all" is about to save, with remove and change-category per payment. */
export function ConfirmBatchModal({ visible, txns, onClose }: Props) {
  const categories = useCategoryNames();
  const confirm = useConfirmBatch();
  const [overrides, setOverrides] = useState<Map<string, string>>(new Map());
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [changing, setChanging] = useState<string | null>(null);

  const groups = useMemo(() => groupBatch(txns, overrides, excluded), [txns, overrides, excluded]);
  const count = groups.reduce((n, g) => n + g.items.length, 0);
  const total = groups.reduce((n, g) => n + g.total, 0);

  const close = () => {
    setOverrides(new Map());
    setExcluded(new Set());
    setChanging(null);
    confirm.reset();
    onClose();
  };

  const submit = () =>
    confirm.mutate(
      groups.flatMap((g) => g.items.map((i) => ({ id: i.id, category: g.category }))),
      { onSuccess: close },
    );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View className="flex-1 bg-white pt-10 dark:bg-black">
        <View className="px-4 pb-3">
          <Text className="text-xl font-bold text-black dark:text-white">Confirm {count} payments</Text>
          <Text className="text-gray-500">{rupees(total)} in total. Check each one before saving.</Text>
        </View>

        <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
          {groups.length === 0 && <Text className="mt-6 text-gray-500">Nothing left to confirm.</Text>}
          {groups.map((g) => (
            <View key={g.category} className="mb-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <View className="flex-row items-center justify-between px-4 py-3">
                <Text className="text-base font-semibold text-black dark:text-white">{g.category}</Text>
                <Text className="font-semibold text-black dark:text-white">{rupees(g.total)}</Text>
              </View>
              {g.items.map((i) => (
                <View key={i.id} className="border-t border-gray-200 px-4 py-3 dark:border-gray-800">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-black dark:text-white" numberOfLines={1}>{i.merchant ?? 'Unknown'}</Text>
                      <Text className="text-xs text-gray-500">{new Date(i.occurred_at).toLocaleDateString('en-IN')}</Text>
                    </View>
                    <Text className="text-gray-700 dark:text-gray-200">{rupees(i.amount)}</Text>
                  </View>
                  <View className="mt-2 flex-row gap-4">
                    <Pressable onPress={() => setChanging(changing === i.id ? null : i.id)}>
                      <Text className="text-sm text-blue-600">Change category</Text>
                    </Pressable>
                    <Pressable onPress={() => setExcluded(new Set(excluded).add(i.id))}>
                      <Text className="text-sm text-red-600">Remove</Text>
                    </Pressable>
                  </View>
                  {changing === i.id && (
                    <View className="mt-2 flex-row flex-wrap gap-2">
                      {categories.map((c) => (
                        <Pressable
                          key={c}
                          onPress={() => {
                            setOverrides(new Map(overrides).set(i.id, c));
                            setChanging(null);
                          }}
                          className={`rounded-full border px-3 py-1 ${c === g.category ? 'border-blue-600 bg-blue-600' : 'border-gray-300 dark:border-gray-700'}`}
                        >
                          <Text className={c === g.category ? 'text-white' : 'text-black dark:text-white'}>{c}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              ))}
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

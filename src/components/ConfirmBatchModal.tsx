import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { groupBatch, type PayeeGroup } from '../data/batch';
import { useConfirmBatch } from '../data/hooks';
import type { TxnRow } from '../data/types';
import { Button, Card, Chip, LinkButton, ink, muted, rupees } from '../ui/components';
import { categoryColor } from '../ui/theme';

type Props = { visible: boolean; txns: TxnRow[]; categories: string[]; onClose: () => void };

function CategoryChips({ categories, current, onPick }: { categories: string[]; current: string; onPick: (c: string) => void }) {
  return (
    <View className="mt-2 flex-row flex-wrap gap-2">
      {categories.map((c) => (
        <Chip key={c} label={c} dot={categoryColor(c)} selected={c === current} onPress={() => onPick(c)} />
      ))}
    </View>
  );
}

/**
 * Preview of everything "Review & confirm" will save: category, then one row per payee
 * ("Blinkit · 12 payments"), expandable to the individual payments. Categories can be changed
 * and payments removed for a whole payee or one payment at a time.
 */
export function ConfirmBatchModal({ visible, txns, categories, onClose }: Props) {
  const insets = useSafeAreaInsets();
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
    onClose();
  };

  const setCategory = (ids: string[], category: string) => {
    const next = new Map(overrides);
    for (const id of ids) next.set(id, category);
    setOverrides(next);
    setChanging(null);
  };
  const remove = (ids: string[]) => setExcluded(new Set([...excluded, ...ids]));

  // The list updates optimistically, so close right away instead of waiting on the network.
  const submit = () => {
    confirm.mutate(groups.flatMap((g) => g.payees.flatMap((p) => p.items.map((i) => ({ id: i.id, category: g.category })))));
    close();
  };

  const renderPayee = (category: string, p: PayeeGroup) => {
    const id = `${category}:${p.key}`;
    const ids = p.items.map((i) => i.id);
    const open = expanded === id;
    const many = p.items.length > 1;
    return (
      <View key={id} className="border-t border-slate-200 dark:border-slate-800">
        <Pressable className="px-4 py-3 active:opacity-60" onPress={() => setExpanded(open ? null : id)}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className={`font-medium ${ink}`} numberOfLines={1}>{p.label}</Text>
              <Text className={`text-xs ${muted}`}>{p.items.length} {many ? 'payments' : 'payment'} · tap to {open ? 'hide' : 'see each'}</Text>
            </View>
            <Text className={ink}>{rupees(p.total)}</Text>
          </View>
        </Pressable>
        <View className="flex-row gap-5 px-4 pb-1">
          <LinkButton label={`Change category${many ? ' (all)' : ''}`} onPress={() => setChanging(changing === `p:${id}` ? null : `p:${id}`)} />
          <LinkButton tone="danger" label={`Remove${many ? ' all' : ''}`} onPress={() => remove(ids)} />
        </View>
        {changing === `p:${id}` && (
          <View className="px-4 pb-3">
            <CategoryChips categories={categories} current={category} onPick={(c) => setCategory(ids, c)} />
          </View>
        )}

        {open && p.items.map((i) => (
          <View key={i.id} className="bg-slate-50 px-6 py-2 dark:bg-slate-950">
            <View className="flex-row items-center justify-between">
              <Text className={`text-sm ${ink}`}>{new Date(i.occurred_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
              <Text className={`text-sm ${ink}`}>{rupees(i.amount)}</Text>
            </View>
            <View className="flex-row gap-5">
              <LinkButton label="Change category" onPress={() => setChanging(changing === `i:${i.id}` ? null : `i:${i.id}`)} />
              <LinkButton tone="danger" label="Remove" onPress={() => remove([i.id])} />
            </View>
            {changing === `i:${i.id}` && <CategoryChips categories={categories} current={category} onPick={(c) => setCategory([i.id], c)} />}
          </View>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View className="flex-1 bg-slate-50 dark:bg-slate-950" style={{ paddingTop: insets.top + 12 }}>
        <View className="px-4 pb-3">
          <Text className={`text-2xl font-bold ${ink}`}>Confirm {count} payments</Text>
          <Text className={muted}>{rupees(total)} in total. Check the sorting, fix anything wrong, then confirm.</Text>
        </View>

        <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
          {groups.length === 0 && <Text className={`mt-6 ${muted}`}>Nothing left to confirm.</Text>}
          {groups.map((g) => (
            <Card key={g.category} className="mb-4 overflow-hidden">
              <View className="flex-row items-center justify-between px-4 py-3">
                <View className="flex-row items-center gap-3">
                  <View className="h-3 w-3 rounded-full" style={{ backgroundColor: categoryColor(g.category) }} />
                  <View>
                    <Text className={`text-base font-semibold ${ink}`}>{g.category}</Text>
                    <Text className={`text-xs ${muted}`}>{g.count} payments · {g.payees.length} payees</Text>
                  </View>
                </View>
                <Text className={`font-semibold ${ink}`}>{rupees(g.total)}</Text>
              </View>
              {g.payees.map((p) => renderPayee(g.category, p))}
            </Card>
          ))}
        </ScrollView>

        <View className="flex-row gap-3 border-t border-slate-200 bg-white px-4 pt-3 dark:border-slate-800 dark:bg-slate-900" style={{ paddingBottom: insets.bottom + 12 }}>
          <Button className="flex-1" label={`Confirm ${count}`} disabled={count === 0} onPress={submit} />
          <Button className="flex-1" variant="secondary" label="Cancel" onPress={close} />
        </View>
      </View>
    </Modal>
  );
}

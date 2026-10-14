import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { groupBatch, type PayeeGroup } from '../data/batch';
import { useConfirmBatch } from '../data/hooks';
import type { TxnRow } from '../data/types';
import { Button, Card, CategoryTile, Chip, LinkButton, Pill, Text, ink, muted, rupees } from '../ui/components';
import { categoryColor } from '../ui/theme';

type Props = { visible: boolean; txns: TxnRow[]; categories: string[]; onClose: () => void };

function CategoryChips({ categories, current, onPick }: { categories: string[]; current: string; onPick: (c: string) => void }) {
  return (
    <View className="mt-2 flex-row flex-wrap gap-2">
      {categories.map((c) => (
        <Chip key={c} label={c} check dot={categoryColor(c)} selected={c === current} onPress={() => onPick(c)} />
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
      <View key={id} className="border-t border-surface-container dark:border-dk-container">
        <Pressable className="flex-row items-center gap-3 px-4 py-3 active:opacity-60" onPress={() => setExpanded(open ? null : id)}>
          <View className="h-9 w-9 items-center justify-center rounded-lg bg-surface-container dark:bg-dk-container">
            <Text className={`font-inter-sb ${ink}`}>{p.label.trim().charAt(0).toUpperCase()}</Text>
          </View>
          <View className="flex-1">
            <Text className={`font-inter-sb ${ink}`} numberOfLines={1}>{p.label}</Text>
            <Text className={`text-xs ${muted}`}>{p.items.length} {many ? 'payments' : 'payment'}</Text>
          </View>
          <Text style={{ fontVariant: ['tabular-nums'] }} className={`font-inter-sb ${ink}`}>{rupees(p.total)}</Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#777587" />
        </Pressable>
        <View className="flex-row gap-5 px-4 pb-1 pl-16">
          <LinkButton label={`Change category${many ? ' (all)' : ''}`} onPress={() => setChanging(changing === `p:${id}` ? null : `p:${id}`)} />
          <LinkButton tone="danger" label={`Remove${many ? ' all' : ''}`} onPress={() => remove(ids)} />
        </View>
        {changing === `p:${id}` && (
          <View className="px-4 pb-3">
            <CategoryChips categories={categories} current={category} onPick={(c) => setCategory(ids, c)} />
          </View>
        )}

        {open && p.items.map((i) => (
          <View key={i.id} className="bg-surface-container-low px-6 py-2 dark:bg-dk-low">
            <View className="flex-row items-center justify-between">
              <Text className={`text-sm ${ink}`}>{new Date(i.occurred_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
              <Text style={{ fontVariant: ['tabular-nums'] }} className={`text-sm ${ink}`}>{rupees(i.amount)}</Text>
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
      <View className="flex-1 bg-surface dark:bg-dk-surface" style={{ paddingTop: insets.top + 8 }}>
        <View className="items-center pb-2">
          <View className="h-1 w-9 rounded-full bg-outline-variant" />
        </View>
        <View className="flex-row items-center gap-3 px-4 pb-3">
          <Pressable onPress={close} hitSlop={10} className="h-10 w-10 items-center justify-center rounded-full active:opacity-50">
            <Ionicons name="close" size={24} color="#777587" />
          </Pressable>
          <Text className={`font-inter-sb text-xl ${ink}`}>Review & confirm</Text>
          <Pill label={`${count} items`} />
        </View>

        <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="mb-4 flex-row gap-3 rounded-2xl bg-surface-container p-4 dark:bg-dk-lowest">
            <Ionicons name="sparkles-outline" size={22} color="#3525cd" />
            <Text className={`flex-1 text-sm ${muted}`}>
              These payments already have a category, learned from your past choices or a well-known brand. Fix anything wrong, then confirm.
            </Text>
          </View>

          {groups.length === 0 && <Text className={`mt-6 ${muted}`}>Nothing left to confirm.</Text>}
          {groups.map((g) => (
            <Card key={g.category} className="mb-4 overflow-hidden">
              <View className="flex-row items-center gap-3 px-4 py-3">
                <CategoryTile category={g.category} />
                <View className="flex-1">
                  <Text className={`font-inter-sb text-base ${ink}`}>{g.category}</Text>
                  <Text className={`text-xs ${muted}`}>{g.count} payments · {g.payees.length} payees</Text>
                </View>
                <Text style={{ fontVariant: ['tabular-nums'] }} className={`font-inter-sb ${ink}`}>{rupees(g.total)}</Text>
              </View>
              {g.payees.map((p) => renderPayee(g.category, p))}
            </Card>
          ))}
          <View className="h-4" />
        </ScrollView>

        <View
          className="rounded-t-3xl border-t border-surface-container bg-surface-container-lowest px-4 pt-4 dark:border-dk-container dark:bg-dk-lowest"
          style={{ paddingBottom: insets.bottom + 12 }}
        >
          <Button label={`Confirm all ${count} • ${rupees(total)}`} iconRight="arrow-forward" disabled={count === 0} onPress={submit} />
          <View className="mt-1 items-center">
            <LinkButton label="Cancel" onPress={close} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

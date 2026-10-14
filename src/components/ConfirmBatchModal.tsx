import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { groupBatch, type PayeeGroup } from '../data/batch';
import { useConfirmBatch } from '../data/hooks';
import type { TxnRow } from '../data/types';
import { Button, Chip, Icon, LinkButton, Pill, SHADOW_SM, Text, ink, muted, rupees } from '../ui/components';
import { categoryMeta, tint } from '../ui/theme';

type Props = { visible: boolean; txns: TxnRow[]; categories: string[]; onClose: () => void };

function Checkbox({ checked, onPress }: { checked: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="-ml-2 h-11 w-11 items-center justify-center rounded-full active:opacity-60">
      <View className={`h-5 w-5 items-center justify-center rounded-md ${checked ? 'bg-primary-container' : 'bg-surface-container dark:bg-dk-container'}`}>
        {checked ? <Icon name="check" size={16} color="#ffffff" /> : null}
      </View>
    </Pressable>
  );
}

/**
 * "Review & Confirm": everything already sorted, grouped by category then payee. Untick a row to
 * keep it in the Inbox, tap its category pill to change it, tap the row to see each payment.
 */
export function ConfirmBatchModal({ visible, txns, categories, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const confirm = useConfirmBatch();
  const [overrides, setOverrides] = useState<Map<string, string>>(new Map());
  const [unchecked, setUnchecked] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [changing, setChanging] = useState<string | null>(null);

  const groups = useMemo(() => groupBatch(txns, overrides, new Set()), [txns, overrides]);
  const checkedItems = groups.flatMap((g) => g.payees.flatMap((p) => p.items.filter((i) => !unchecked.has(i.id)).map((i) => ({ ...i, category: g.category }))));
  const count = checkedItems.length;
  const total = checkedItems.reduce((n, i) => n + i.amount, 0);
  const allChecked = unchecked.size === 0;

  const close = () => {
    setOverrides(new Map());
    setUnchecked(new Set());
    setCollapsed(new Set());
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
  const toggle = (ids: string[], on: boolean) => {
    const next = new Set(unchecked);
    for (const id of ids) (on ? next.delete(id) : next.add(id));
    setUnchecked(next);
  };

  // The list updates optimistically, so close right away instead of waiting on the network.
  const submit = () => {
    confirm.mutate(checkedItems.map((i) => ({ id: i.id, category: i.category })));
    close();
  };

  const renderPayee = (category: string, p: PayeeGroup, last: boolean) => {
    const id = `${category}:${p.key}`;
    const ids = p.items.map((i) => i.id);
    const on = ids.every((i) => !unchecked.has(i));
    const open = expanded === id;
    const meta = categoryMeta(category);
    const sum = p.items.reduce((n, i) => n + i.amount, 0);
    const letter = p.label.trim().charAt(0).toUpperCase();
    return (
      <View key={id}>
        <View className="flex-row items-center gap-2 p-4">
          <Checkbox checked={on} onPress={() => toggle(ids, !on)} />
          <Pressable onPress={() => setExpanded(open ? null : id)} className="flex-1 flex-row items-center gap-2 active:opacity-70">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-surface-container dark:bg-dk-container">
              <Text className={`font-inter-sb text-title-md ${muted}`}>{letter}</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between gap-2">
                <Text className={`flex-shrink font-inter-sb text-title-md ${on ? ink : muted}`} numberOfLines={1}>{p.label}</Text>
                <Text style={{ fontVariant: ['tabular-nums'] }} className={`font-inter-sb text-title-md ${on ? ink : muted}`}>-{rupees(sum)}</Text>
              </View>
              <View className="mt-1 flex-row items-center justify-between gap-2">
                <Text className={`flex-shrink text-body-sm ${muted}`} numberOfLines={1}>{p.items.length} {p.items.length === 1 ? 'payment' : 'payments'} • tap to {open ? 'hide' : 'see each'}</Text>
                <Pressable onPress={() => setChanging(changing === `p:${id}` ? null : `p:${id}`)} hitSlop={6} className="flex-row items-center gap-1 rounded-full bg-secondary-fixed px-2 py-0.5 active:opacity-70">
                  <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                  <Text className="font-inter-md text-label-sm text-on-secondary-fixed">{category}</Text>
                  <Icon name="edit" size={12} color="#002113" />
                </Pressable>
              </View>
            </View>
          </Pressable>
        </View>

        {changing === `p:${id}` && (
          <View className="flex-row flex-wrap gap-1.5 px-4 pb-4 pl-16">
            {categories.map((c) => (
              <Chip key={c} tone="category" label={c} dot={categoryMeta(c).color} check selected={c === category} onPress={() => setCategory(ids, c)} />
            ))}
          </View>
        )}

        {open && p.items.map((i) => (
          <View key={i.id} className="flex-row items-center gap-2 bg-surface-container-low py-2 pl-14 pr-4 dark:bg-dk-low">
            <Checkbox checked={!unchecked.has(i.id)} onPress={() => toggle([i.id], unchecked.has(i.id))} />
            <Text className={`flex-1 text-body-md ${ink}`}>{new Date(i.occurred_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
            <Text style={{ fontVariant: ['tabular-nums'] }} className={`font-inter-sb text-body-md ${ink}`}>-{rupees(i.amount)}</Text>
            <LinkButton label="Change" onPress={() => setChanging(changing === `i:${i.id}` ? null : `i:${i.id}`)} />
          </View>
        ))}
        {open && p.items.map((i) => changing === `i:${i.id}` ? (
          <View key={`c-${i.id}`} className="flex-row flex-wrap gap-1.5 bg-surface-container-low px-4 pb-3 pl-16 dark:bg-dk-low">
            {categories.map((c) => (
              <Chip key={c} tone="category" label={c} dot={categoryMeta(c).color} check selected={c === category} onPress={() => setCategory([i.id], c)} />
            ))}
          </View>
        ) : null)}
        {!last && <View className="ml-16 mr-4 h-px bg-surface-container dark:bg-dk-container" />}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View className="flex-1 bg-surface dark:bg-dk-surface" style={{ paddingTop: insets.top }}>
        <View className="items-center pb-1 pt-2">
          <View className="h-1 w-9 rounded-full bg-outline-variant/60" />
        </View>
        <View className="h-16 flex-row items-center gap-2 px-4">
          <Pressable onPress={close} hitSlop={8} className="-ml-1 h-11 w-11 items-center justify-center rounded-full active:bg-surface-container">
            <Icon name="close" size={24} color="#464555" />
          </Pressable>
          <Text className={`font-inter-sb text-headline-sm ${ink}`}>Review & Confirm</Text>
          <Pill label={`${count} items`} />
        </View>

        <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 24 }}>
          <View style={SHADOW_SM} className="flex-row items-start gap-2 rounded-xl bg-surface-container-high p-4 dark:bg-dk-container">
            <View className="h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: tint('#3525cd', 0.1) }}>
              <Icon name="auto-awesome" size={20} color="#3525cd" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="font-inter-sb text-label-md text-primary dark:text-dk-primary">Pre-sorted for you</Text>
                <View className="h-1.5 w-1.5 rounded-full bg-secondary" />
                <Text className={`text-body-sm ${muted}`}>From your past choices</Text>
              </View>
              <Text className={`mt-0.5 text-body-sm ${muted}`}>Untick any row to keep it in your Inbox for later. Tap a category to change it.</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className={`text-body-sm ${muted}`}>{count} of {txns.length} selected</Text>
            <Pressable onPress={() => setUnchecked(allChecked ? new Set(txns.map((t) => t.id)) : new Set())} className="h-8 flex-row items-center gap-1 rounded-lg bg-surface-container-low px-2.5 active:opacity-60 dark:bg-dk-container">
              <Icon name="done-all" size={16} color="#3525cd" />
              <Text className="font-inter-md text-label-md text-primary dark:text-dk-primary">{allChecked ? 'Deselect all' : 'Select all'}</Text>
            </Pressable>
          </View>

          {groups.length === 0 && <Text className={muted}>Nothing left to confirm.</Text>}
          {groups.map((g) => {
            const meta = categoryMeta(g.category);
            const isCollapsed = collapsed.has(g.category);
            const sub = g.payees.flatMap((p) => p.items).filter((i) => !unchecked.has(i.id)).reduce((n, i) => n + i.amount, 0);
            return (
              <View key={g.category} style={SHADOW_SM} className="overflow-hidden rounded-2xl bg-surface-container-lowest dark:bg-dk-lowest">
                <Pressable
                  onPress={() => setCollapsed((s) => { const n = new Set(s); n.has(g.category) ? n.delete(g.category) : n.add(g.category); return n; })}
                  className="flex-row items-center justify-between bg-surface-container-low px-4 py-3.5 active:opacity-70 dark:bg-dk-low"
                >
                  <View className="flex-1 flex-row items-center gap-2">
                    <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary-fixed dark:bg-dk-container">
                      <Icon name={meta.icon} size={20} color="#3525cd" />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className={`flex-shrink font-inter-sb text-title-md ${ink}`} numberOfLines={1}>{g.category}</Text>
                        <Pill label={`${g.count} items`} tone="highest" className="py-0.5" />
                      </View>
                      <Text className={`text-body-sm ${muted}`}>Subtotal: {rupees(sub)}</Text>
                    </View>
                  </View>
                  <Icon name={isCollapsed ? 'expand-more' : 'expand-less'} size={22} color="#464555" />
                </Pressable>
                {!isCollapsed && g.payees.map((p, idx) => renderPayee(g.category, p, idx === g.payees.length - 1))}
              </View>
            );
          })}
        </ScrollView>

        <View style={{ shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: -6 }, elevation: 8, paddingBottom: insets.bottom + 12 }} className="gap-1 rounded-t-3xl bg-surface-container-lowest px-4 pt-4 dark:bg-dk-lowest">
          <Button size="lg" label={`Confirm all ${count} • ${rupees(total)}`} iconRight="arrow-forward" disabled={count === 0} onPress={submit} />
          <View className="items-center">
            <LinkButton label="Cancel" onPress={close} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

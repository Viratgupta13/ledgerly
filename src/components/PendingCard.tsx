import { memo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useAddCategory, useReview } from '../data/hooks';
import type { TxnRow } from '../data/types';
import { Amount, Button, Chip, Icon, Input, LinkButton, NewChip, Pill, SectionLabel, SHADOW_SM, Text, Toggle, ink, muted } from '../ui/components';
import { categoryMeta } from '../ui/theme';

export { rupees } from '../ui/components';

type Props = {
  txn: TxnRow;
  categories: string[];
  suggestions: string[];
  /** 'review' for new SMS, 'edit' to change an already-confirmed transaction. */
  mode?: 'review' | 'edit';
  onDone?: () => void;
};

const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' });

function PendingCardImpl({ txn, categories, suggestions, mode = 'review', onDone }: Props) {
  const review = useReview();
  const addCategory = useAddCategory();
  const isDebit = txn.type === 'debit';
  const isPerson = isDebit && txn.payee_kind === 'person';
  const [open, setOpen] = useState(mode === 'edit');
  const [category, setCategory] = useState<string | null>(txn.category);
  const [note, setNote] = useState(txn.note ?? '');
  const [remember, setRemember] = useState(txn.payee_kind !== 'person');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const createCategory = async () => {
    const name = newName.trim();
    if (!name || name.length > 30) return;
    const existing = categories.find((c) => c.toLowerCase() === name.toLowerCase());
    try {
      if (!existing) await addCategory.mutateAsync(name);
      setCategory(existing ?? name);
      setNewName('');
      setAdding(false);
    } catch {
      // the error message is rendered below the input
    }
  };

  const submit = (status: 'confirmed' | 'ignored' | 'pending') => {
    review.mutate({
      id: txn.id,
      status,
      category: isDebit ? category : null,
      note: note.trim() || null,
      remember: status === 'confirmed' && isDebit && remember && category && txn.payee_key ? { payeeKey: txn.payee_key } : undefined,
    });
    onDone?.();
  };

  const meta = categoryMeta(category);
  const tileIcon = isDebit ? (category ? meta.icon : isPerson ? 'two-wheeler' : 'help-outline') : 'payments';
  const tileBox = !isDebit ? 'bg-secondary-container' : category ? 'bg-surface-container-high dark:bg-dk-container' : 'bg-surface-container-highest dark:bg-dk-high';
  const tileIconColor = !isDebit ? '#00714d' : category ? '#3525cd' : '#464555';

  // Expanded card: tinted header, divider and a form drawer (variants 3-5 of the design).
  if (open || mode === 'edit') {
    const headerBox = !isDebit ? 'bg-secondary-fixed/30' : 'bg-surface-container-low dark:bg-dk-low';
    return (
      <View style={{ shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 }} className="overflow-hidden rounded-xl bg-surface-container-lowest dark:bg-dk-lowest">
        <Pressable disabled={mode === 'edit' || !isDebit} onPress={() => setOpen(false)} className={`flex-row items-center justify-between p-4 ${headerBox}`}>
          <View className="flex-1 flex-row items-center gap-2">
            <View className={`h-11 w-11 items-center justify-center rounded-xl ${!isDebit ? 'bg-secondary' : isPerson ? 'bg-secondary-fixed' : 'bg-tertiary-fixed'}`}>
              <Icon name={!isDebit ? 'payments' : isPerson ? 'person' : tileIcon} size={24} color={!isDebit ? '#ffffff' : isPerson ? '#006c49' : '#950029'} />
            </View>
            <View className="flex-1">
              <Text className={`font-inter-b text-headline-sm ${ink}`} numberOfLines={1}>{txn.merchant ?? 'Unknown payee'}</Text>
              <Text className={`text-body-sm ${muted}`}>{when(txn.occurred_at)}</Text>
            </View>
          </View>
          <View className="items-end gap-1 pl-2">
            <Amount value={txn.amount} type={txn.type} className="text-headline-sm" />
            {!isDebit ? <Pill label="INFLOW" tone="success" className="py-0.5" /> : null}
          </View>
        </Pressable>
        <View className="h-px w-full bg-surface-container-high dark:bg-dk-container" />

        <View className="gap-4 bg-surface-container-lowest p-4 dark:bg-dk-lowest">
          {!isDebit ? (
            <View className="flex-row items-center gap-3 rounded-xl bg-surface-container-low p-3 dark:bg-dk-low">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-surface-container-high dark:bg-dk-container">
                <Icon name="verified-user" size={18} color="#006c49" />
              </View>
              <View className="flex-1">
                <Text className={`font-inter-sb text-title-md ${ink}`}>Credit detected via bank SMS</Text>
                <Text className={`mt-0.5 text-body-sm ${muted}`}>No category needed. Confirm to add it to your income.</Text>
              </View>
            </View>
          ) : (
            <>
              {isPerson && (
                <View className="flex-row items-start gap-2.5 rounded-xl bg-surface-container-high p-3 dark:bg-dk-container">
                  <Icon name="contact-support" size={20} color="#3525cd" />
                  <View className="flex-1">
                    <Text className={`font-inter-sb text-title-md ${ink}`}>Paid to a person. What was this for?</Text>
                    <Text className={`mt-0.5 text-body-sm ${muted}`}>Person-to-person payments vary widely. Select a category and note so monthly analytics reflect actual spending.</Text>
                  </View>
                </View>
              )}

              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <SectionLabel>Select category</SectionLabel>
                  <Text className="font-inter-md text-label-sm text-primary">{categories.length} available</Text>
                </View>
                <View className="flex-row flex-wrap gap-1.5">
                  {categories.map((c) => (
                    <Chip key={c} tone="category" label={c} check dot={categoryMeta(c).color} selected={category === c} onPress={() => setCategory(category === c ? null : c)} />
                  ))}
                  <NewChip onPress={() => setAdding(!adding)} />
                </View>
                {adding && (
                  <View className="mt-1 flex-row items-center gap-2 rounded-xl bg-surface-container-low p-2 dark:bg-dk-low">
                    <View className="flex-1">
                      <Input variant="field" className="h-10 bg-surface-container-lowest" placeholder="New category name (e.g. Pet Care)" value={newName} onChangeText={setNewName} maxLength={30} autoFocus onSubmitEditing={createCategory} />
                    </View>
                    <Pressable onPress={createCategory} style={SHADOW_SM} className="h-9 flex-row items-center gap-1 rounded-lg bg-primary px-3 active:opacity-70">
                      <Icon name="check" size={16} color="#ffffff" />
                      <Text className="font-inter-md text-label-md text-on-primary">Add</Text>
                    </Pressable>
                  </View>
                )}
                {addCategory.error && <Text className="text-body-sm text-error">{addCategory.error.message}</Text>}
              </View>

              {suggestions.length > 0 && (
                <View className="gap-1.5">
                  <SectionLabel>Recent quick tags</SectionLabel>
                  <View className="flex-row flex-wrap gap-1.5">
                    {suggestions.map((s) => (
                      <Chip key={s} small label={`+ ${s}`} selected={note === s} onPress={() => setNote(note === s ? '' : s)} />
                    ))}
                  </View>
                </View>
              )}

              <View className="gap-1">
                <SectionLabel>Add note / context</SectionLabel>
                <Input variant="field" icon="edit-note" placeholder="Note (e.g. Dinner with Ananya & Rohan)" value={note} onChangeText={setNote} />
              </View>

              {txn.payee_key && category && (
                <View className="flex-row items-center justify-between gap-3 rounded-xl bg-surface-container-low p-3 dark:bg-dk-low">
                  <View className="flex-1 flex-row items-center gap-2.5">
                    <View className="h-8 w-8 items-center justify-center rounded-lg bg-surface-container-high dark:bg-dk-container">
                      <Icon name={isPerson ? 'lock-reset' : 'auto-mode'} size={18} color={isPerson ? '#777587' : '#3525cd'} />
                    </View>
                    <View className="flex-1">
                      <Text className={`font-inter-sb text-label-lg ${ink}`}>Always use {category} for {txn.merchant}</Text>
                      <Text className={`text-body-sm ${muted}`}>{isPerson ? 'Default is OFF to avoid miscategorizing casual split bills' : 'Creates a sorting rule for all future payments'}</Text>
                    </View>
                  </View>
                  <Toggle value={remember} onChange={setRemember} />
                </View>
              )}
            </>
          )}

          <View className="flex-row gap-2 pt-1">
            {mode === 'edit' ? (
              <Button className="flex-1" variant="secondary" icon="close" label="Cancel" onPress={() => onDone?.()} />
            ) : (
              <Button className="flex-1" variant="secondary" icon={isDebit ? 'visibility-off' : 'close'} label="Ignore" onPress={() => submit('ignored')} />
            )}
            <Button
              className="flex-1"
              variant={isDebit ? 'primary' : 'success'}
              icon={isDebit ? 'check-circle' : 'check'}
              label={mode === 'edit' ? 'Save' : isDebit ? 'Confirm' : 'Confirm Income'}
              onPress={() => submit('confirmed')}
            />
          </View>
          {mode === 'edit' ? (
            <View className="items-center">
              <LinkButton label="Move back to Inbox" onPress={() => submit('pending')} />
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  // Collapsed row.
  const needs = isDebit && !category;
  return (
    <Pressable onPress={() => (isDebit ? setOpen(true) : setOpen(true))} style={SHADOW_SM} className="rounded-2xl bg-surface-container-lowest p-3.5 active:opacity-80 dark:bg-dk-lowest">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-3">
          <View className={`h-11 w-11 items-center justify-center rounded-xl ${tileBox}`}>
            <Icon name={tileIcon} size={22} color={tileIconColor} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className={`flex-shrink font-inter-sb text-title-md ${ink}`} numberOfLines={1}>{txn.merchant ?? 'Unknown payee'}</Text>
              {!isDebit ? <Pill label="Inflow" tone="success" className="px-1.5 py-0.5" /> : null}
            </View>
            <View className="mt-0.5 flex-row items-center gap-2">
              <Text className={`text-body-sm ${muted}`} numberOfLines={1}>{when(txn.occurred_at)}{isPerson && txn.note ? ` • "${txn.note}"` : ''}</Text>
              {category ? (
                <>
                  <View className="h-1 w-1 rounded-full bg-outline-variant" />
                  <Text className="font-inter-md text-label-md text-primary dark:text-dk-primary">{category}</Text>
                </>
              ) : null}
            </View>
          </View>
        </View>
        <View className="flex-row items-center gap-2 pl-2">
          <View className="items-end">
            <Amount value={txn.amount} type={txn.type} className="tracking-tight" />
            {!needs ? <Text className="text-[11px] text-secondary dark:text-dk-secondary">{isDebit ? 'Pre-sorted' : 'Bank Credit'}</Text> : null}
          </View>
          <Icon name="chevron-right" size={20} color="#c7c4d8" />
        </View>
      </View>
      {needs ? (
        <View className="mt-2.5 flex-row items-center justify-between border-t border-surface-container-low pt-2 dark:border-dk-container">
          <Pill label="Needs category" tone="rose" icon="help" />
          <View className="flex-row items-center gap-1">
            <Text className="font-inter-md text-label-md text-primary dark:text-dk-primary">Assign category</Text>
            <Icon name="arrow-forward" size={16} color="#3525cd" />
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

export const PendingCard = memo(PendingCardImpl);

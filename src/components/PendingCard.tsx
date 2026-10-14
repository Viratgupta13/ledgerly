import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { memo, useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { useAddCategory, useReview } from '../data/hooks';
import type { TxnRow } from '../data/types';
import { Amount, Button, Card, CategoryTile, Chip, Input, Pill, SectionLabel, Text, ink, muted } from '../ui/components';
import { categoryColor, categoryMeta, tint } from '../ui/theme';

export { rupees } from '../ui/components';

type Props = {
  txn: TxnRow;
  categories: string[];
  suggestions: string[];
  /** 'review' for new SMS, 'edit' to change an already-confirmed transaction. */
  mode?: 'review' | 'edit';
  onDone?: () => void;
};

const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

function PendingCardImpl({ txn, categories, suggestions, mode = 'review', onDone }: Props) {
  const review = useReview();
  const addCategory = useAddCategory();
  const isDebit = txn.type === 'debit';
  const isPerson = isDebit && txn.payee_kind === 'person';
  const [open, setOpen] = useState(mode === 'edit' || !isDebit);
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

  const submit = (status: 'confirmed' | 'ignored') => {
    review.mutate({
      id: txn.id,
      status,
      category: isDebit ? category : null,
      note: note.trim() || null,
      remember: status === 'confirmed' && isDebit && remember && category && txn.payee_key ? { payeeKey: txn.payee_key } : undefined,
    });
    onDone?.();
  };

  return (
    <Card className={`mb-3 overflow-hidden`}>
      <Pressable
        className="flex-row items-center gap-3 p-4 active:opacity-60"
        disabled={mode === 'edit' || !isDebit}
        onPress={() => setOpen((o) => !o)}
      >
        {isDebit ? (
          <CategoryTile category={category} />
        ) : (
          <View className="h-10 w-10 items-center justify-center rounded-[10px] bg-secondary-container">
            <MaterialIcons name="payments" size={20} color="#00714d" />
          </View>
        )}
        <View className="flex-1">
          <Text className={`font-inter-sb text-base ${ink}`} numberOfLines={1}>{txn.merchant ?? 'Unknown payee'}</Text>
          <View className="mt-0.5 flex-row items-center gap-1.5">
            <Text className={`text-xs ${muted}`}>{when(txn.occurred_at)}</Text>
            {isDebit && category ? (
              <>
                <View className="h-1 w-1 rounded-full bg-outline-variant" />
                <View className="h-2 w-2 rounded-full" style={{ backgroundColor: categoryColor(category) }} />
                <Text className={`text-xs ${ink}`}>{category}</Text>
              </>
            ) : null}
          </View>
          {isPerson && txn.note ? <Text className={`mt-0.5 text-xs italic ${muted}`} numberOfLines={1}>"{txn.note}"</Text> : null}
        </View>
        <View className="items-end gap-1">
          <Amount value={txn.amount} type={txn.type} className="text-base" />
          {!isDebit ? <Pill label="Inflow" tone="emerald" /> : category ? <Text className="text-[11px] text-secondary">Pre-sorted</Text> : <Pill label="Needs category" tone="rose" />}
        </View>
      </Pressable>

      {open && (
        <View className="border-t border-surface-container px-4 pb-4 pt-3 dark:border-dk-container">
          {isPerson && (
            <View className="mb-4 flex-row gap-3 rounded-xl bg-surface-container p-3 dark:bg-dk-container">
              <Ionicons name="help-circle-outline" size={20} color="#3525cd" />
              <View className="flex-1">
                <Text className={`font-inter-sb ${ink}`}>Paid to a person. What was this for?</Text>
                <Text className={`mt-0.5 text-xs ${muted}`}>Payments to people vary a lot. Pick a category and add a note so your monthly totals stay accurate.</Text>
              </View>
            </View>
          )}

          {isDebit && (
            <>
              <SectionLabel>Select category</SectionLabel>
              <View className="mt-2 flex-row flex-wrap gap-2">
                {categories.map((c) => (
                  <Chip key={c} label={c} check dot={categoryColor(c)} selected={category === c} onPress={() => setCategory(category === c ? null : c)} />
                ))}
                <Chip label="+ New" dashed onPress={() => setAdding(true)} />
              </View>

              {adding && (
                <View className="mt-3 flex-row items-center gap-2">
                  <Input className="flex-1" placeholder="New category name" value={newName} onChangeText={setNewName} maxLength={30} autoFocus onSubmitEditing={createCategory} />
                  <Button label="Add" onPress={createCategory} loading={addCategory.isPending} />
                </View>
              )}
              {addCategory.error && <Text className="mt-2 text-error">{addCategory.error.message}</Text>}

              {suggestions.length > 0 && (
                <View className="mt-4">
                  <SectionLabel>Recent quick tags</SectionLabel>
                  <View className="mt-2 flex-row flex-wrap gap-2">
                    {suggestions.map((s) => (
                      <Chip key={s} label={s} selected={note === s} onPress={() => setNote(note === s ? '' : s)} />
                    ))}
                  </View>
                </View>
              )}

              <View className="mt-4">
                <Input icon="create-outline" placeholder="Note (e.g. Rapido ride)" value={note} onChangeText={setNote} />
              </View>

              {txn.payee_key && category && (
                <View className="mt-3 flex-row items-center gap-3 rounded-xl bg-surface-container p-3 dark:bg-dk-container">
                  <View className="flex-1">
                    <Text className={`font-inter-sb ${ink}`}>Always use {category} for {txn.merchant}</Text>
                    <Text className={`text-xs ${muted}`}>
                      {isPerson ? 'Off by default so casual payments are not miscategorised.' : 'Pre-fills this category on every future payment to this payee.'}
                    </Text>
                  </View>
                  <Switch value={remember} onValueChange={setRemember} trackColor={{ true: '#3525cd' }} />
                </View>
              )}
            </>
          )}

          <View className="mt-4 flex-row gap-3">
            {mode === 'edit' ? (
              <Button className="flex-1" variant="secondary" label="Cancel" onPress={() => onDone?.()} />
            ) : (
              <Button className="flex-1" variant="secondary" icon="eye-off-outline" label="Ignore" onPress={() => submit('ignored')} />
            )}
            <Button
              className="flex-1"
              icon="checkmark-circle-outline"
              label={mode === 'edit' ? 'Save' : isDebit ? 'Confirm' : 'Confirm income'}
              onPress={() => submit('confirmed')}
            />
          </View>
        </View>
      )}
    </Card>
  );
}

export const PendingCard = memo(PendingCardImpl);

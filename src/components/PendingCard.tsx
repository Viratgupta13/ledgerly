import { Ionicons } from '@expo/vector-icons';
import { memo, useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { useAddCategory, useReview } from '../data/hooks';
import type { TxnRow } from '../data/types';
import { Amount, Button, Card, Chip, Input, ink, muted } from '../ui/components';
import { categoryColor } from '../ui/theme';

export { rupees } from '../ui/components';

type Props = {
  txn: TxnRow;
  categories: string[];
  suggestions: string[];
  /** 'review' for new SMS, 'edit' to change an already-confirmed transaction. */
  mode?: 'review' | 'edit';
  onDone?: () => void;
};

function PendingCardImpl({ txn, categories, suggestions, mode = 'review', onDone }: Props) {
  const review = useReview();
  const addCategory = useAddCategory();
  const isDebit = txn.type === 'debit';
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
      remember:
        status === 'confirmed' && isDebit && remember && category && txn.payee_key ? { payeeKey: txn.payee_key } : undefined,
    });
    onDone?.();
  };

  return (
    <Card className="mb-3 overflow-hidden">
      <Pressable
        className="flex-row items-center justify-between p-4 active:opacity-60"
        disabled={mode === 'edit' || !isDebit}
        onPress={() => setOpen((o) => !o)}
      >
        <View className="flex-1 pr-3">
          <Text className={`text-base font-semibold ${ink}`} numberOfLines={1}>{txn.merchant ?? 'Unknown payee'}</Text>
          <Text className={`mt-0.5 text-xs ${muted}`}>{new Date(txn.occurred_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</Text>
          {isDebit && !open && (
            <View className="mt-2 flex-row items-center gap-2">
              {category ? (
                <>
                  <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: categoryColor(category) }} />
                  <Text className={`text-sm ${ink}`}>{category}</Text>
                </>
              ) : (
                <Text className="text-sm text-amber-600">Needs a category</Text>
              )}
              <Ionicons name="chevron-down" size={14} color="#94a3b8" />
            </View>
          )}
        </View>
        <Amount value={txn.amount} type={txn.type} className="text-base" />
      </Pressable>

      {isDebit && open && (
        <View className="border-t border-slate-200 p-4 dark:border-slate-800">
          {txn.payee_kind === 'person' && <Text className="mb-3 text-sm text-amber-600">Paid to a person. What was this for?</Text>}

          <View className="flex-row flex-wrap gap-2">
            {categories.map((c) => (
              <Chip key={c} label={c} dot={categoryColor(c)} selected={category === c} onPress={() => setCategory(category === c ? null : c)} />
            ))}
            <Chip label="+ New" dashed onPress={() => setAdding(true)} />
          </View>

          {adding && (
            <View className="mt-3 flex-row items-center gap-2">
              <Input className="flex-1" placeholder="New category name" value={newName} onChangeText={setNewName} maxLength={30} autoFocus onSubmitEditing={createCategory} />
              <Button label="Add" onPress={createCategory} loading={addCategory.isPending} />
            </View>
          )}
          {addCategory.error && <Text className="mt-2 text-rose-600">{addCategory.error.message}</Text>}

          {suggestions.length > 0 && (
            <View className="mt-4 flex-row flex-wrap gap-2">
              {suggestions.map((s) => (
                <Chip key={s} label={s} selected={note === s} onPress={() => setNote(note === s ? '' : s)} />
              ))}
            </View>
          )}
          <Input className="mt-3" placeholder="Note (e.g. Rapido ride)" value={note} onChangeText={setNote} />

          {txn.payee_key && category && (
            <View className="mt-3 min-h-12 flex-row items-center justify-between">
              <Text className={`flex-1 pr-3 text-sm ${muted}`}>Always use {category} for {txn.merchant}</Text>
              <Switch value={remember} onValueChange={setRemember} />
            </View>
          )}
        </View>
      )}

      {open && (
        <View className="flex-row gap-3 px-4 pb-4 pt-1">
          <Button className="flex-1" label={mode === 'edit' ? 'Save' : 'Confirm'} onPress={() => submit('confirmed')} />
          {mode === 'edit' ? (
            <Button className="flex-1" variant="secondary" label="Cancel" onPress={() => onDone?.()} />
          ) : (
            <Button className="flex-1" variant="secondary" label="Ignore" onPress={() => submit('ignored')} />
          )}
        </View>
      )}
    </Card>
  );
}

export const PendingCard = memo(PendingCardImpl);

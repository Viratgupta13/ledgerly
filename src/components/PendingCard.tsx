import { useState } from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { useAddCategory, useCategoryNames, useNoteSuggestions, useReview } from '../data/hooks';
import type { TxnRow } from '../data/types';

export const rupees = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

type Props = {
  txn: TxnRow;
  /** 'review' for new SMS, 'edit' to change an already-confirmed transaction. */
  mode?: 'review' | 'edit';
  onDone?: () => void;
};

export function PendingCard({ txn, mode = 'review', onDone }: Props) {
  const review = useReview();
  const categories = useCategoryNames();
  const suggestions = useNoteSuggestions();
  const addCategory = useAddCategory();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const isDebit = txn.type === 'debit';
  const [category, setCategory] = useState<string | null>(txn.category);
  const [note, setNote] = useState(txn.note ?? '');
  const [remember, setRemember] = useState(txn.payee_kind !== 'person');

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

  const submit = (status: 'confirmed' | 'ignored') =>
    review.mutate(
      {
        id: txn.id,
        status,
        category: isDebit ? category : null,
        note: note.trim() || null,
        remember:
          status === 'confirmed' && isDebit && remember && category && txn.payee_key
            ? { payeeKey: txn.payee_key }
            : undefined,
      },
      { onSuccess: onDone },
    );

  return (
    <View className="mb-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-base font-semibold text-black dark:text-white" numberOfLines={1}>
            {txn.merchant ?? 'Unknown payee'}
          </Text>
          <Text className="text-xs text-gray-500">{new Date(txn.occurred_at).toLocaleString('en-IN')}</Text>
        </View>
        <Text className={isDebit ? 'text-base font-semibold text-red-600' : 'text-base font-semibold text-green-600'}>
          {isDebit ? '-' : '+'}{rupees(txn.amount)}
        </Text>
      </View>

      {isDebit && txn.payee_kind === 'person' && (
        <Text className="mt-2 text-sm text-amber-600">Paid to a person. What was this for?</Text>
      )}

      {isDebit && (
        <>
          <View className="mt-3 flex-row flex-wrap gap-2">
            {categories.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCategory(category === c ? null : c)}
                className={`rounded-full border px-3 py-1 ${category === c ? 'border-blue-600 bg-blue-600' : 'border-gray-300 dark:border-gray-700'}`}
              >
                <Text className={category === c ? 'text-white' : 'text-black dark:text-white'}>{c}</Text>
              </Pressable>
            ))}
            <Pressable className="rounded-full border border-dashed border-gray-400 px-3 py-1" onPress={() => setAdding(true)}>
              <Text className="text-black dark:text-white">+ New</Text>
            </Pressable>
          </View>
          {adding && (
            <View className="mt-3 flex-row items-center gap-2">
              <TextInput
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-black dark:border-gray-700 dark:text-white"
                placeholder="New category name"
                placeholderTextColor="#9ca3af"
                value={newName}
                onChangeText={setNewName}
                maxLength={30}
                autoFocus
                onSubmitEditing={createCategory}
              />
              <Pressable className="rounded-lg bg-blue-600 px-4 py-2" onPress={createCategory}>
                <Text className="font-semibold text-white">Add</Text>
              </Pressable>
            </View>
          )}
          {addCategory.error && <Text className="mt-2 text-red-600">{addCategory.error.message}</Text>}

          {suggestions.length > 0 && (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {suggestions.map((s) => (
                <Pressable key={s} onPress={() => setNote(s)} className="rounded-full bg-gray-100 px-3 py-1 dark:bg-gray-800">
                  <Text className="text-sm text-black dark:text-white">{s}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <TextInput
            className="mt-3 rounded-lg border border-gray-300 px-3 py-2 text-black dark:border-gray-700 dark:text-white"
            placeholder="Note (e.g. Rapido ride)"
            placeholderTextColor="#9ca3af"
            value={note}
            onChangeText={setNote}
          />
          {txn.payee_key && category && (
            <View className="mt-3 flex-row items-center justify-between">
              <Text className="flex-1 pr-3 text-sm text-gray-600 dark:text-gray-300">
                Always use {category} for {txn.merchant}
              </Text>
              <Switch value={remember} onValueChange={setRemember} />
            </View>
          )}
        </>
      )}

      <View className="mt-4 flex-row gap-3">
        <Pressable
          className="flex-1 items-center rounded-lg bg-blue-600 py-2"
          onPress={() => submit('confirmed')}
          disabled={review.isPending}
        >
          <Text className="font-semibold text-white">{mode === 'edit' ? 'Save' : 'Confirm'}</Text>
        </Pressable>
        <Pressable
          className="flex-1 items-center rounded-lg border border-gray-300 py-2 dark:border-gray-700"
          onPress={() => (mode === 'edit' ? onDone?.() : submit('ignored'))}
          disabled={review.isPending}
        >
          <Text className="font-semibold text-black dark:text-white">{mode === 'edit' ? 'Cancel' : 'Ignore'}</Text>
        </Pressable>
      </View>
      {review.error && <Text className="mt-2 text-red-600">{review.error.message}</Text>}
    </View>
  );
}

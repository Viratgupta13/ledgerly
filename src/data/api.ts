import { dedupeKey, type ParsedTxn, type RawSms } from '../parser';
import { supabase } from '../lib/supabase';
import type { CategoryRow, RuleRow, TxnRow, TxnStatus } from './types';

const TXN_COLUMNS =
  'id, amount, type, merchant, category, bank_ref, occurred_at, status, note, payee_key, payee_kind';

export async function listTxns(status: TxnStatus): Promise<TxnRow[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(TXN_COLUMNS)
    .eq('status', status)
    .order('occurred_at', { ascending: false });
  if (error) throw error;
  return data as TxnRow[];
}

export async function listRules(): Promise<RuleRow[]> {
  const { data, error } = await supabase.from('merchant_rules').select('id, payee_key, category').order('payee_key');
  if (error) throw error;
  return data as RuleRow[];
}

export async function deleteRule(id: string): Promise<void> {
  const { error } = await supabase.from('merchant_rules').delete().eq('id', id);
  if (error) throw error;
}

export async function saveRule(userId: string, payeeKey: string, category: string): Promise<void> {
  const { error } = await supabase
    .from('merchant_rules')
    .upsert({ user_id: userId, payee_key: payeeKey, category }, { onConflict: 'user_id,payee_key' });
  if (error) throw error;
}

/**
 * Saves parsed SMS as `pending` transactions. Rows that already exist (same user + bank_ref)
 * are left untouched, so re-scanning never resets a confirmed transaction.
 * The SMS text itself is never uploaded; only the extracted fields are.
 * Returns how many rows were new.
 */
export async function importParsed(userId: string, items: { sms: RawSms; txn: ParsedTxn }[]): Promise<number> {
  if (items.length === 0) return 0;
  const rules = new Map((await listRules()).map((r) => [r.payee_key, r.category]));

  const rows = items.map(({ sms, txn }) => ({
    user_id: userId,
    amount: txn.amount,
    type: txn.type,
    merchant: txn.merchant,
    payee_key: txn.payeeKey,
    payee_kind: txn.payeeKind,
    // A saved rule means the user already decided this payee: categorise and confirm it.
    category: txn.type === 'debit' && txn.payeeKey ? (rules.get(txn.payeeKey) ?? null) : null,
    bank_ref: dedupeKey(sms, txn),
    occurred_at: txn.occurredAt,
    status: txn.type === 'debit' && txn.payeeKey && rules.has(txn.payeeKey) ? ('confirmed' as const) : ('pending' as const),
  }));

  let inserted = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const { data, error } = await supabase
      .from('transactions')
      .upsert(rows.slice(i, i + 100), { onConflict: 'user_id,bank_ref', ignoreDuplicates: true })
      .select('id');
    if (error) throw error;
    inserted += data?.length ?? 0;
  }
  return inserted;
}

export async function reviewTxn(input: {
  id: string;
  status: Exclude<TxnStatus, 'pending'>;
  category: string | null;
  note: string | null;
}): Promise<void> {
  const { id, ...patch } = input;
  const { error } = await supabase.from('transactions').update(patch).eq('id', id);
  if (error) throw error;
}

export async function listCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase.from('categories').select('id, name').order('name');
  if (error) throw error;
  return data as CategoryRow[];
}

export async function addCategory(userId: string, name: string): Promise<void> {
  const { error } = await supabase.from('categories').insert({ user_id: userId, name: name.trim() });
  if (error) throw error;
}

/**
 * Applies a payee rule to transactions that already exist: pending debits get the category and
 * are confirmed; confirmed debits with no category get the category. Anything the user has
 * already categorised or ignored is left alone.
 */
export async function applyRule(payeeKey: string, category: string): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .update({ category, status: 'confirmed' })
    .eq('payee_key', payeeKey)
    .eq('type', 'debit')
    .or('status.eq.pending,and(status.eq.confirmed,category.is.null)');
  if (error) throw error;
}

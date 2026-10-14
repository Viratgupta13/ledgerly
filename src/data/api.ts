import type { ParsedTxn, RawSms } from '../parser';
import { supabase } from '../lib/supabase';
import { buildHistory, buildRows, predefinedCategory } from './rows';
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
  const [ruleRows, confirmed] = await Promise.all([listRules(), listTxns('confirmed')]);
  const rules = new Map(ruleRows.map((r) => [r.payee_key, r.category]));
  const history = buildHistory(confirmed);

  const rows = buildRows(userId, items, rules, history);

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
 * Pre-fills a category on pending debits that have none, using explicit rules, what the user
 * confirmed before, and well-known brands. Never confirms anything. Returns rows updated.
 */
export async function applyPredefined(): Promise<number> {
  const [pending, confirmed, ruleRows] = await Promise.all([listTxns('pending'), listTxns('confirmed'), listRules()]);
  const rules = new Map(ruleRows.map((r) => [r.payee_key, r.category]));
  const history = buildHistory(confirmed);

  const byCategory = new Map<string, string[]>();
  for (const t of pending) {
    if (t.type !== 'debit' || t.category) continue;
    const category = predefinedCategory(t.payee_key, rules, history);
    if (category) byCategory.set(category, [...(byCategory.get(category) ?? []), t.id]);
  }
  let updated = 0;
  for (const [category, ids] of byCategory) {
    for (let i = 0; i < ids.length; i += 100) {
      const { error } = await supabase.from('transactions').update({ category }).in('id', ids.slice(i, i + 100));
      if (error) throw error;
      updated += Math.min(100, ids.length - i);
    }
  }
  return updated;
}

/** Confirms the given pending payments, each with its final category. Returns how many were saved. */
export async function confirmBatch(updates: { id: string; category: string }[]): Promise<number> {
  const byCategory = new Map<string, string[]>();
  for (const u of updates) byCategory.set(u.category, [...(byCategory.get(u.category) ?? []), u.id]);

  let saved = 0;
  for (const [category, ids] of byCategory) {
    for (let i = 0; i < ids.length; i += 100) {
      const chunk = ids.slice(i, i + 100);
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'confirmed', category })
        .in('id', chunk)
        .eq('status', 'pending');
      if (error) throw error;
      saved += chunk.length;
    }
  }
  return saved;
}

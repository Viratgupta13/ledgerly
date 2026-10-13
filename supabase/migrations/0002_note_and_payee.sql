-- Review flow: a free-text note per transaction ("Rapido ride") and the parser's payee hint.

alter table public.transactions
  add column note text,
  add column payee_key text,
  add column payee_kind text not null default 'unknown'
    check (payee_kind in ('person', 'merchant', 'unknown'));

create index transactions_user_payee_idx on public.transactions (user_id, payee_key);

-- Ledgerly initial schema: transactions + merchant_rules, both private per user via RLS.

create type public.txn_type as enum ('debit', 'credit');
create type public.txn_status as enum ('pending', 'confirmed', 'ignored');

create table public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amount      numeric(14, 2) not null check (amount > 0),
  type        public.txn_type not null,
  merchant    text,
  category    text,
  bank_ref    text,
  occurred_at timestamptz not null,
  status      public.txn_status not null default 'pending',
  raw_body    text,
  created_at  timestamptz not null default now(),
  -- Same SMS imported twice must not create a second row. NULL refs never collide.
  constraint transactions_user_bank_ref_key unique (user_id, bank_ref)
);

create index transactions_user_occurred_idx on public.transactions (user_id, occurred_at desc);
create index transactions_user_status_idx on public.transactions (user_id, status);

create table public.merchant_rules (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  payee_key  text not null,
  category   text not null,
  created_at timestamptz not null default now(),
  constraint merchant_rules_user_payee_key unique (user_id, payee_key)
);

alter table public.transactions enable row level security;
alter table public.merchant_rules enable row level security;

create policy "transactions_select_own" on public.transactions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "transactions_insert_own" on public.transactions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "transactions_update_own" on public.transactions
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "transactions_delete_own" on public.transactions
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "merchant_rules_select_own" on public.merchant_rules
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "merchant_rules_insert_own" on public.merchant_rules
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "merchant_rules_update_own" on public.merchant_rules
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "merchant_rules_delete_own" on public.merchant_rules
  for delete to authenticated using ((select auth.uid()) = user_id);

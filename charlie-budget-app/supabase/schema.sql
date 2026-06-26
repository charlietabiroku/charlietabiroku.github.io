create table if not exists public.budget_entries (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  spent_on date not null,
  amount numeric(12, 2) not null check (amount > 0),
  month_tag text not null,
  week_number smallint not null check (week_number between 1 and 5),
  created_at timestamptz not null default now()
);

create index if not exists budget_entries_user_spent_on_idx
  on public.budget_entries (user_id, spent_on desc);

create index if not exists budget_entries_user_month_week_idx
  on public.budget_entries (user_id, month_tag, week_number);

alter table public.budget_entries enable row level security;

create policy "Users can read their own budget entries"
  on public.budget_entries
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own budget entries"
  on public.budget_entries
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own budget entries"
  on public.budget_entries
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their own budget entries"
  on public.budget_entries
  for delete
  to authenticated
  using (user_id = auth.uid());

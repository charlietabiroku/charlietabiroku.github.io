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

create table if not exists public.budget_month_settings (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  month_tag text not null,
  income numeric(12, 2) not null check (income >= 0),
  updated_at timestamptz not null default now(),
  unique (user_id, month_tag)
);

create index if not exists budget_month_settings_user_month_idx
  on public.budget_month_settings (user_id, month_tag);

alter table public.budget_month_settings enable row level security;

create policy "Users can read their own month settings"
  on public.budget_month_settings
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their own month settings"
  on public.budget_month_settings
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their own month settings"
  on public.budget_month_settings
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'budget_entries'
  ) then
    alter publication supabase_realtime add table public.budget_entries;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'budget_month_settings'
  ) then
    alter publication supabase_realtime add table public.budget_month_settings;
  end if;
end $$;

-- Onmode — agenda pessoal (compromissos do dia, com navegação entre dias)
-- Rode este arquivo no SQL Editor do seu projeto Supabase, depois dos
-- anteriores (0001, 0002, 0003).

create table if not exists public.agenda_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  time time,
  title text not null,
  notes text,
  done boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.agenda_items enable row level security;

create policy "agenda_items: all own" on public.agenda_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists agenda_items_user_date_idx
  on public.agenda_items (user_id, date);

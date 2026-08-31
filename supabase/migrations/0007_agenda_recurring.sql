-- Onmode — tarefas recorrentes na agenda (ex: "Escola às 7:30" toda seg-sex)
-- Rode este arquivo no SQL Editor do seu projeto Supabase, depois dos
-- anteriores (0001 a 0006).

-- A regra em si: título, horário, notas e em quais dias da semana repete.
-- weekdays segue a convenção de Date.getDay() do JS: 0=domingo … 6=sábado.
create table if not exists public.agenda_recurring_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  time time,
  notes text,
  weekdays smallint[] not null check (array_length(weekdays, 1) between 1 and 7),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.agenda_recurring_items enable row level security;

create policy "agenda_recurring_items: all own" on public.agenda_recurring_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Cada ocorrência de uma tarefa recorrente vira um agenda_items normal de
-- verdade (mesmo fluxo de concluir/editar/checklist que já existe) — esta
-- coluna só marca de qual regra ela veio. "set null" ao apagar a regra:
-- as ocorrências já criadas continuam existindo como itens avulsos.
alter table public.agenda_items
  add column if not exists recurring_item_id uuid references public.agenda_recurring_items (id) on delete set null;

-- Evita duplicar a mesma ocorrência (mesma regra, mesmo dia) se o usuário
-- navegar pra frente e pra trás na agenda várias vezes.
create unique index if not exists agenda_items_recurring_unique
  on public.agenda_items (recurring_item_id, date)
  where recurring_item_id is not null;

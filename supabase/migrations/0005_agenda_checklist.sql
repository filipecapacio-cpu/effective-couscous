-- Pulso — checklist de subtarefas dentro de cada item da agenda
-- Rode este arquivo no SQL Editor do seu projeto Supabase, depois dos
-- anteriores (0001 a 0004).

create table if not exists public.agenda_checklist_items (
  id uuid primary key default gen_random_uuid(),
  agenda_item_id uuid not null references public.agenda_items (id) on delete cascade,
  text text not null,
  done boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.agenda_checklist_items enable row level security;

create policy "agenda_checklist_items: all own" on public.agenda_checklist_items
  for all using (
    exists (
      select 1 from public.agenda_items ai
      where ai.id = agenda_item_id and ai.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.agenda_items ai
      where ai.id = agenda_item_id and ai.user_id = auth.uid()
    )
  );

create index if not exists agenda_checklist_items_item_idx
  on public.agenda_checklist_items (agenda_item_id, position);

-- Pulso — anamnese, planos gerados por IA e chat do assistente
-- Rode este arquivo no SQL Editor do seu projeto Supabase, depois de já
-- ter rodado 0001_init.sql e 0002_profile_goal_and_editing.sql.

create table if not exists public.anamneses (
  user_id uuid primary key references auth.users (id) on delete cascade,
  age int not null check (age between 10 and 100),
  sex text not null check (sex in ('masculino', 'feminino', 'prefiro_nao_dizer')),
  height_cm int not null check (height_cm between 100 and 250),
  weight_kg numeric not null check (weight_kg between 30 and 300),
  goal_weight_kg numeric,
  activity_level text not null check (activity_level in ('sedentario', 'leve', 'moderado', 'intenso')),
  days_per_week int not null check (days_per_week between 1 and 7),
  training_location text not null check (
    training_location in ('casa_sem_equipamento', 'casa_com_equipamento', 'academia')
  ),
  experience_level text not null check (experience_level in ('iniciante', 'intermediario', 'avancado')),
  injuries text,
  dietary_restrictions text,
  notes text,
  updated_at timestamptz not null default now()
);

alter table public.anamneses enable row level security;

create policy "anamneses: all own" on public.anamneses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.ai_plans (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan jsonb not null,
  model text not null,
  generated_at timestamptz not null default now()
);

alter table public.ai_plans enable row level security;

create policy "ai_plans: all own" on public.ai_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create policy "chat_messages: all own" on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists chat_messages_user_created_idx
  on public.chat_messages (user_id, created_at);

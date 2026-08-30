-- Onmode — registro do treino efetivamente feito no dia
-- (modalidade, intensidade e duração, independente da recomendação/plano)
-- Rode este arquivo no SQL Editor do seu projeto Supabase, depois dos
-- anteriores (0001 a 0005).

create table if not exists public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null default current_date,
  modality text not null check (modality in (
    'Luta', 'Corrida', 'Musculação', 'Mobilidade', 'Cardio/HIIT',
    'Alongamento', 'Natação', 'Ciclismo', 'Yoga', 'Funcional/Crossfit', 'Descanso'
  )),
  intensity_label text check (intensity_label in ('Leve', 'Moderado', 'Intenso')),
  intensity_score int check (intensity_score between 1 and 10),
  duration_min int check (duration_min >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.workout_logs enable row level security;

create policy "workout_logs: all own" on public.workout_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

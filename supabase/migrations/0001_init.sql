-- Pulso — schema inicial
-- Rode este arquivo no SQL Editor do seu projeto Supabase
-- (Project -> SQL Editor -> New query -> cole e execute).

create extension if not exists "pgcrypto";

-- Um perfil por usuário autenticado (auth.users é gerenciada pelo Supabase).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  goal text check (goal in ('performance', 'emagrecimento', 'massa', 'habito')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);

-- Cria automaticamente um perfil vazio quando alguém se cadastra.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Um treino por dia por usuário.
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null default current_date,
  title text not null,
  duration_min int,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.workouts enable row level security;

create policy "workouts: all own" on public.workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Exercícios de um treino.
create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  name text not null,
  detail text,
  position int not null default 0,
  done boolean not null default false
);

alter table public.workout_exercises enable row level security;

create policy "workout_exercises: all own" on public.workout_exercises
  for all using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = auth.uid()
    )
  );

-- Refeições planejadas por dia por usuário.
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null default current_date,
  name text not null,
  detail text,
  kcal int,
  position int not null default 0,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.meals enable row level security;

create policy "meals: all own" on public.meals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

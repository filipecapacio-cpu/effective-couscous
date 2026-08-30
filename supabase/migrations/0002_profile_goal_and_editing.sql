-- Onmode — meta semanal no perfil
-- Rode este arquivo no SQL Editor do seu projeto Supabase, depois de já
-- ter rodado o 0001_init.sql.

alter table public.profiles
  add column if not exists weekly_goal int not null default 4
    check (weekly_goal between 1 and 7);

-- Onmode — reforço de segurança e performance do banco
-- (achados pelo linter do Supabase durante a revisão da plataforma).
--
-- 1) Reescreve TODAS as políticas de RLS trocando `auth.uid()` por
--    `(select auth.uid())`. É a mesma regra de segurança (cada pessoa só
--    vê os próprios dados), mas o Postgres passa a calcular o usuário uma
--    vez por consulta em vez de uma vez por linha — recomendação oficial
--    do Supabase, importante conforme a base de usuários cresce.
-- 2) Cria índices nas chaves estrangeiras que estavam sem cobertura, pra
--    deixar as buscas por usuário/treino mais rápidas.
-- 3) Impede que a função interna handle_new_user() seja chamada de fora
--    (ela é gatilho de criação de perfil, não deveria ser exposta na API).

-- ── 1. Políticas de RLS otimizadas ───────────────────────────────────────

-- profiles
drop policy if exists "profiles: select own" on public.profiles;
create policy "profiles: select own" on public.profiles
  for select using ((select auth.uid()) = id);
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using ((select auth.uid()) = id);
drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles
  for insert with check ((select auth.uid()) = id);

-- workouts
drop policy if exists "workouts: all own" on public.workouts;
create policy "workouts: all own" on public.workouts
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- workout_exercises (dono via join com workouts)
drop policy if exists "workout_exercises: all own" on public.workout_exercises;
create policy "workout_exercises: all own" on public.workout_exercises
  for all using (
    exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.workouts w where w.id = workout_id and w.user_id = (select auth.uid()))
  );

-- meals
drop policy if exists "meals: all own" on public.meals;
create policy "meals: all own" on public.meals
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- agenda_items
drop policy if exists "agenda_items: all own" on public.agenda_items;
create policy "agenda_items: all own" on public.agenda_items
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- agenda_checklist_items (dono via join com agenda_items)
drop policy if exists "agenda_checklist_items: all own" on public.agenda_checklist_items;
create policy "agenda_checklist_items: all own" on public.agenda_checklist_items
  for all using (
    exists (select 1 from public.agenda_items ai where ai.id = agenda_item_id and ai.user_id = (select auth.uid()))
  )
  with check (
    exists (select 1 from public.agenda_items ai where ai.id = agenda_item_id and ai.user_id = (select auth.uid()))
  );

-- agenda_recurring_items
drop policy if exists "agenda_recurring_items: all own" on public.agenda_recurring_items;
create policy "agenda_recurring_items: all own" on public.agenda_recurring_items
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- workout_logs
drop policy if exists "workout_logs: all own" on public.workout_logs;
create policy "workout_logs: all own" on public.workout_logs
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- anamneses
drop policy if exists "anamneses: all own" on public.anamneses;
create policy "anamneses: all own" on public.anamneses
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ai_plans
drop policy if exists "ai_plans: all own" on public.ai_plans;
create policy "ai_plans: all own" on public.ai_plans
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- chat_messages
drop policy if exists "chat_messages: all own" on public.chat_messages;
create policy "chat_messages: all own" on public.chat_messages
  for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ── 2. Índices nas chaves estrangeiras sem cobertura ─────────────────────

create index if not exists idx_agenda_recurring_items_user_id on public.agenda_recurring_items (user_id);
create index if not exists idx_meals_user_id on public.meals (user_id);
create index if not exists idx_workout_exercises_workout_id on public.workout_exercises (workout_id);

-- ── 3. Não expor a função de gatilho na API pública ──────────────────────

-- anon/authenticated herdam do papel `public`, então revoga dele também.
revoke execute on function public.handle_new_user() from anon, authenticated, public;

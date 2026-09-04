-- Onmode — ajustes de performance apontados pelo advisor do Supabase
-- Rode depois da 0014_coupon_fixes.sql.

create index if not exists profiles_coupon_id_idx on public.profiles (coupon_id);

-- Reavaliar auth.uid() linha a linha é lento em tabelas grandes - o padrão
-- recomendado pelo próprio Supabase é envolver em (select ...), que o
-- Postgres então avalia uma vez só por consulta.
drop policy if exists "coupons: influencer reads own" on public.coupons;
create policy "coupons: influencer reads own" on public.coupons
  for select using ((select auth.uid()) = influencer_id);

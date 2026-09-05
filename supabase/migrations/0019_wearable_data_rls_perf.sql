-- Onmode — ajuste de performance na policy de wearable_data
-- Rode depois da 0018_protect_terms_accepted.sql.
--
-- Mesmo ajuste já feito em coupons (0015_perf.sql): reavaliar auth.uid()
-- linha a linha é lento em tabelas grandes - o padrão recomendado pelo
-- Supabase é envolver em (select ...), avaliado uma vez só por consulta.

drop policy if exists "wearable_data: select own" on public.wearable_data;
create policy "wearable_data: select own" on public.wearable_data
  for select using ((select auth.uid()) = user_id);

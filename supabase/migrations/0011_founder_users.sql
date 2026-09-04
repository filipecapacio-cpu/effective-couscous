-- Onmode — usuários de antes dos planos pagos ganham acesso completo pra sempre
--
-- Todo mundo que criou conta antes da funcionalidade de planos existir (o
-- corte é o momento exato em que a migration 0009_plans.sql - que criou as
-- colunas de assinatura - foi aplicada: 2026-09-03 22:24:28 UTC) vira
-- "founder": acesso a tudo (nível Elite), pra sempre, sem pagar.
--
-- A coluna is_founder já existia desde a 0009_plans.sql mas nunca tinha
-- sido usada em lugar nenhum - essa é a primeira vez que ganha função de
-- verdade.

update public.profiles
set is_founder = true
where created_at < '2026-09-03T22:24:28Z';

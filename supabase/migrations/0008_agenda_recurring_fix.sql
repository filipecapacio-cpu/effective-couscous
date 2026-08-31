-- Onmode — corrige o índice único das tarefas recorrentes da agenda
-- Rode depois da 0007_agenda_recurring.sql.
--
-- O índice parcial criado na 0007 ("where recurring_item_id is not null")
-- não é reconhecido pelo ON CONFLICT usado pra materializar as ocorrências
-- (Postgres exige um índice/constraint SEM predicado pra isso), o que
-- fazia a inserção falhar silenciosamente sempre que existia alguma regra
-- pra materializar. Uma constraint única "normal" resolve, porque o
-- Postgres já trata NULL como sempre distinto de outro NULL - itens
-- avulsos (recurring_item_id nulo) continuam podendo se repetir à vontade
-- no mesmo dia, só pares (regra, dia) reais é que ficam únicos.

drop index if exists public.agenda_items_recurring_unique;

alter table public.agenda_items
  add constraint agenda_items_recurring_date_unique unique (recurring_item_id, date);

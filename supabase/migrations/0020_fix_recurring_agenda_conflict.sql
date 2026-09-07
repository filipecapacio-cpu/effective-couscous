-- Onmode — corrige o upsert de tarefas recorrentes na agenda
-- Rode depois da 0019_wearable_data_rls_perf.sql.
--
-- Achado em produção via logs de erro: ensureRecurringAgendaForDate()
-- (src/app/actions/agenda.ts) faz upsert com
-- onConflict: "recurring_item_id,date", mas a 0007_agenda_recurring.sql
-- criou um índice único PARCIAL (`where recurring_item_id is not null`).
-- Postgres não casa um ON CONFLICT (col1, col2) simples com um índice
-- parcial — precisa da mesma cláusula WHERE no próprio ON CONFLICT, que o
-- Supabase client não permite passar. Resultado: toda materialização de
-- tarefa recorrente falhava com "there is no unique or exclusion
-- constraint matching the ON CONFLICT specification" (12 ocorrências nos
-- logs, agenda de pelo menos 2 usuários).
--
-- Troca pelo índice não-parcial equivalente: como o Postgres trata NULL
-- como sempre distinto de NULL num índice único, itens avulsos (sem
-- tarefa recorrente, recurring_item_id = null) continuam podendo coexistir
-- livremente no mesmo dia - a unicidade só passa a valer de verdade entre
-- ocorrências da MESMA regra recorrente na MESMA data, que é a intenção
-- original. E agora casa certinho com o ON CONFLICT do código.

drop index if exists agenda_items_recurring_unique;

create unique index if not exists agenda_items_recurring_unique
  on public.agenda_items (recurring_item_id, date);

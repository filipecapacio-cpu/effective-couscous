-- Onmode — CPF/CNPJ do usuário, exigido pela Asaas pra emitir cobrança
-- Rode depois da 0020_fix_recurring_agenda_conflict.sql.
--
-- Achado testando o checkout de verdade em produção: a Asaas recusa criar
-- qualquer cobrança sem CPF/CNPJ do cliente ("Para criar esta cobrança é
-- necessário preencher o CPF ou CNPJ do cliente") - exigência da própria
-- Asaas/Receita, não passava no sandbox. Coletado só no momento de assinar
-- um plano pago (startPlan), não no cadastro - quem fica no Free nunca
-- precisa disso.

alter table public.profiles add column if not exists cpf_cnpj text;

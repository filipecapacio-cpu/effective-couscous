-- Onmode — registro de uso da IA, pra impor um limite diário simples
-- Rode depois da 0015_perf.sql.
--
-- Sem isso, um loop malicioso (ou um script batendo direto na Server
-- Action, já que ela roda no servidor e a tela sozinha não impede) podia
-- gerar custo sem controle na API da Anthropic. Sem policy de propósito -
-- só o backend (service role) grava/lê isso, não tem tela que precise
-- expor pro cliente.

create table if not exists public.ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('chat', 'plan')),
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_log_user_kind_created_idx
  on public.ai_usage_log (user_id, kind, created_at);

alter table public.ai_usage_log enable row level security;

-- Onmode — integração com wearables (Garmin, via Terra API - tryterra.co)
-- Rode depois da 0016_ai_rate_limit.sql.
--
-- Duas peças novas:
-- 1. Colunas em profiles pra guardar a ligação com o usuário na Terra
--    (garmin_terra_user_id) e o status da conexão.
-- 2. wearable_data: uma linha por métrica por dia (sono, FC de repouso,
--    body battery, estresse, ...), com o payload bruto do webhook junto
--    pra facilitar debug sem precisar re-sincronizar com a Terra.

alter table public.profiles
  add column if not exists garmin_terra_user_id text unique,
  add column if not exists garmin_status text not null default 'disconnected'
    check (garmin_status in ('connected', 'disconnected')),
  add column if not exists garmin_connected_at timestamptz,
  add column if not exists garmin_disconnected_at timestamptz;

create table if not exists public.wearable_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  source text not null default 'garmin',
  metric_type text not null,
  value numeric,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, date, source, metric_type)
);

create index if not exists wearable_data_user_date_idx
  on public.wearable_data (user_id, date desc);

alter table public.wearable_data enable row level security;

-- Só leitura pro dono dos dados - não existe policy de insert/update/delete
-- pro client de propósito: quem grava aqui é sempre o webhook da Terra
-- (src/app/api/webhooks/terra/route.ts), usando a service role key (que
-- ignora RLS), nunca o navegador do usuário.
create policy "wearable_data: select own" on public.wearable_data
  for select using (auth.uid() = user_id);

-- Mesmo cuidado que já existe pras colunas de assinatura
-- (0010_protect_billing_columns.sql): sem isso, qualquer usuário logado
-- podia chamar o Supabase direto do navegador e se auto-declarar
-- "conectado" ao Garmin, ou apontar garmin_terra_user_id pro user_id da
-- Terra de outra pessoa (e passar a receber os dados dela).
--
-- IMPORTANTE: security invoker (não definer) de propósito - o objetivo é
-- ler o papel de quem está chamando (current_user), igual ao trigger de
-- billing.
create or replace function public.protect_wearable_columns()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.garmin_terra_user_id := old.garmin_terra_user_id;
    new.garmin_status := old.garmin_status;
    new.garmin_connected_at := old.garmin_connected_at;
    new.garmin_disconnected_at := old.garmin_disconnected_at;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_wearable_columns_trigger on public.profiles;
create trigger protect_wearable_columns_trigger
  before update on public.profiles
  for each row execute function public.protect_wearable_columns();

revoke execute on function public.protect_wearable_columns() from anon, authenticated, public;

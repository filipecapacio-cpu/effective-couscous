-- Onmode — trava as colunas de assinatura contra escrita direta do cliente
--
-- A tabela public.profiles tem a policy "profiles: update own"
-- (auth.uid() = id, sem restrição de coluna), que existia desde antes do
-- recurso de planos pagos. Isso significa que qualquer usuário logado
-- podia chamar o Supabase direto do navegador e setar
-- subscription_status = 'active' na própria linha, liberando acesso pago
-- sem passar pelo Asaas nem pagar nada.
--
-- Este gatilho reverte qualquer tentativa de alterar as colunas de
-- assinatura vinda de fora do backend (papéis "anon"/"authenticated" -
-- os únicos usados pelo navegador/app do usuário). Escritas feitas pelo
-- servidor com a service role key (usada em src/app/actions/subscription.ts
-- e no webhook do Asaas) continuam funcionando normalmente, assim como
-- consultas SQL diretas feitas como admin.
--
-- Rode depois da 0009_plans.sql.

-- IMPORTANTE: security invoker (não definer) de propósito - o objetivo é
-- ler o papel de quem está chamando (current_user). Com security definer,
-- current_user vira o dono da função dentro do corpo, o que anula a
-- checagem inteira (isso quebrou o teste na primeira versão desta migration).
create or replace function public.protect_billing_columns()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon') then
    new.plan_tier := old.plan_tier;
    new.billing_cycle := old.billing_cycle;
    new.subscription_status := old.subscription_status;
    new.trial_ends_at := old.trial_ends_at;
    new.asaas_customer_id := old.asaas_customer_id;
    new.asaas_subscription_id := old.asaas_subscription_id;
    new.checkout_url := old.checkout_url;
    new.is_founder := old.is_founder;
    new.has_chosen_plan := old.has_chosen_plan;
    new.subscription_updated_at := old.subscription_updated_at;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_billing_columns_trigger on public.profiles;
create trigger protect_billing_columns_trigger
  before update on public.profiles
  for each row execute function public.protect_billing_columns();

-- Não expor essa função na API pública (mesmo cuidado que já tomamos com
-- handle_new_user() na revisão de segurança anterior).
revoke execute on function public.protect_billing_columns() from anon, authenticated, public;

-- Onmode — cupons de desconto para parceiros/influencers, com rastreio de
-- comissão por venda.
-- Rode depois da 0012_consent.sql.
--
-- Modelo: um cupom dá desconto SÓ na primeira cobrança de quem assina com
-- ele (a assinatura em si continua com o preço cheio nas renovações - o
-- desconto é aplicado direto na cobrança específica no Asaas, não no valor
-- recorrente da assinatura). A "venda" que gera comissão é o primeiro
-- pagamento CONFIRMADO (não o início do trial - muita gente começa trial e
-- não paga) - por isso profiles.first_payment_confirmed_at/value existem:
-- marcam esse momento uma única vez, mesmo que o usuário cancele depois.

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  influencer_id uuid not null references auth.users (id) on delete cascade,
  discount_percent numeric not null check (discount_percent > 0 and discount_percent <= 100),
  commission_percent numeric not null check (commission_percent > 0 and commission_percent <= 100),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists coupons_influencer_id_idx on public.coupons (influencer_id);

alter table public.coupons enable row level security;

-- Só o dono do cupom lê os próprios (o painel em /parceiro). A checagem do
-- código na hora de assinar roda pelo backend com a service role key (que
-- ignora RLS), então não existe policy pública de leitura aqui - ninguém
-- além do dono e do backend enxerga um cupom pelo Supabase direto.
create policy "coupons: influencer reads own" on public.coupons
  for select using (auth.uid() = influencer_id);

alter table public.profiles
  add column if not exists is_influencer boolean not null default false,
  add column if not exists coupon_id uuid references public.coupons (id),
  add column if not exists coupon_discount_percent numeric,
  add column if not exists first_payment_confirmed_at timestamptz,
  add column if not exists first_payment_value numeric;

-- Estende o gatilho que já travava as colunas de billing contra escrita
-- direta do cliente (migration 0010): as novas colunas aqui têm o mesmo
-- risco - sem isso, qualquer usuário logado poderia se auto-declarar
-- influencer, se atribuir o cupom de outra pessoa, ou forjar uma "venda"
-- confirmada direto pelo navegador.
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
    new.is_influencer := old.is_influencer;
    new.coupon_id := old.coupon_id;
    new.coupon_discount_percent := old.coupon_discount_percent;
    new.first_payment_confirmed_at := old.first_payment_confirmed_at;
    new.first_payment_value := old.first_payment_value;
  end if;
  return new;
end;
$$;

-- Onmode — planos, trial e assinatura (Asaas)
-- Rode depois das migrations 0001 a 0008 no SQL Editor do Supabase.

alter table public.profiles
  add column if not exists plan_tier text not null default 'free'
    check (plan_tier in ('free', 'pro', 'elite')),
  add column if not exists billing_cycle text
    check (billing_cycle in ('monthly', 'annual')),
  add column if not exists subscription_status text not null default 'none'
    check (subscription_status in ('none', 'trialing', 'active', 'past_due', 'canceled')),
  add column if not exists trial_ends_at timestamptz,
  add column if not exists asaas_customer_id text,
  add column if not exists asaas_subscription_id text,
  add column if not exists checkout_url text,
  add column if not exists is_founder boolean not null default false,
  add column if not exists has_chosen_plan boolean not null default false,
  add column if not exists subscription_updated_at timestamptz;

create index if not exists profiles_asaas_subscription_id_idx
  on public.profiles (asaas_subscription_id);
create index if not exists profiles_asaas_customer_id_idx
  on public.profiles (asaas_customer_id);

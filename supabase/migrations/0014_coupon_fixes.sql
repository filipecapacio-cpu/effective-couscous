-- Onmode — corrige reversão de comissão em estorno/chargeback
-- Rode depois da 0013_coupons.sql.
--
-- Faltava guardar QUAL cobrança do Asaas gerou a "venda" (first_payment_*)
-- pra poder reverter quando exatamente essa cobrança é estornada/chargeback
-- - sem isso, um cliente que pede reembolso continuava contando comissão
-- pro influencer pra sempre.

alter table public.profiles
  add column if not exists first_payment_asaas_id text;

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
    new.first_payment_asaas_id := old.first_payment_asaas_id;
  end if;
  return new;
end;
$$;

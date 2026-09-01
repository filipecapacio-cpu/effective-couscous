-- Onmode — status de assinatura/pagamento
-- Rode este arquivo no SQL Editor do seu projeto Supabase, depois dos
-- anteriores (0001 a 0008).

alter table public.profiles
  add column if not exists subscription_status text not null default 'pending'
    check (subscription_status in ('pending', 'active', 'canceled')),
  add column if not exists asaas_customer_id text,
  add column if not exists asaas_payment_id text,
  add column if not exists checkout_url text,
  add column if not exists subscription_updated_at timestamptz;

-- Índice pra localizar rápido o profile a partir do id do pagamento/cliente
-- quando o webhook do Asaas chega.
create index if not exists profiles_asaas_payment_id_idx
  on public.profiles (asaas_payment_id);
create index if not exists profiles_asaas_customer_id_idx
  on public.profiles (asaas_customer_id);

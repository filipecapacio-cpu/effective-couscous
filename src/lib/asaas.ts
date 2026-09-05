/**
 * Integração com a API do Asaas (https://docs.asaas.com).
 *
 * Variáveis de ambiente (definir na Vercel e em .env.local):
 * - ASAAS_API_KEY: chave de API (sandbox ou produção)
 * - ASAAS_ENV: "sandbox" | "production" (default: "sandbox")
 * - ASAAS_WEBHOOK_TOKEN: token definido por você ao configurar o webhook no
 *   Asaas (Configurações -> Integrações -> Webhooks). O Asaas devolve esse
 *   token no header "asaas-access-token" em toda chamada ao seu webhook —
 *   é assim que confirmamos que a chamada realmente veio do Asaas.
 */

import { TRIAL_DAYS, planPrice, type PlanTier, type BillingCycle } from "@/lib/plans";

const ASAAS_BASE_URL =
  process.env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";

function apiKey(): string {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error("ASAAS_API_KEY não configurada.");
  return key;
}

async function asaasFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${ASAAS_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Asaas ${path} falhou (${res.status}): ${body}`);
  }

  return res.json() as Promise<T>;
}

export type AsaasCustomer = { id: string; name: string; email: string };

/** Cria um cliente no Asaas para o usuário do Onmode. */
export async function createAsaasCustomer(params: {
  name: string;
  email: string;
  externalReference: string;
}): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: params.name,
      email: params.email,
      externalReference: params.externalReference,
    }),
  });
}

export type AsaasSubscription = {
  id: string;
  status: string;
};

export type AsaasFirstPayment = {
  id: string;
  invoiceUrl: string;
};

/**
 * Cria a assinatura recorrente (Pro ou Elite, mensal ou anual) com 7 dias
 * de trial: a primeira cobrança só vence em `TRIAL_DAYS` dias — o usuário
 * usa o plano completo até lá, e se pagar a tempo a renovação já é
 * automática. O `invoiceUrl` do primeiro pagamento é o link de checkout
 * (Pix, boleto ou cartão) que mostramos na tela de assinatura.
 */
export async function createAsaasSubscription(params: {
  customerId: string;
  tier: PlanTier;
  cycle: BillingCycle;
  externalReference: string;
}): Promise<{ subscription: AsaasSubscription; invoiceUrl: string; firstPaymentId: string }> {
  const value = planPrice(params.tier, params.cycle);
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + TRIAL_DAYS);

  const subscription = await asaasFetch<AsaasSubscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      customer: params.customerId,
      billingType: "UNDEFINED",
      cycle: params.cycle === "annual" ? "YEARLY" : "MONTHLY",
      value,
      nextDueDate: nextDueDate.toISOString().slice(0, 10),
      description: `Onmode ${params.tier === "pro" ? "Pro" : "Elite"} (${
        params.cycle === "annual" ? "anual" : "mensal"
      })`,
      externalReference: params.externalReference,
    }),
  });

  // Busca a primeira cobrança gerada pra pegar o link de checkout (invoiceUrl)
  // e o id dela (usado depois pra aplicar desconto de cupom, se tiver).
  const payments = await asaasFetch<{ data: AsaasFirstPayment[] }>(
    `/payments?subscription=${subscription.id}&limit=1`
  );
  const firstPayment = payments.data[0];
  if (!firstPayment) throw new Error("Asaas não retornou o link de checkout da assinatura.");

  return { subscription, invoiceUrl: firstPayment.invoiceUrl, firstPaymentId: firstPayment.id };
}

/** Cancela a assinatura no Asaas (usado se o usuário trocar de plano ou cancelar). */
export async function cancelAsaasSubscription(subscriptionId: string): Promise<void> {
  await asaasFetch(`/subscriptions/${subscriptionId}`, { method: "DELETE" });
}

/**
 * Muda o valor de UMA cobrança específica (não da assinatura toda) - é assim
 * que aplicamos desconto de cupom só na primeira cobrança: a assinatura
 * continua com o valor cheio pras próximas renovações, só essa cobrança
 * pontual sai mais barata. Só funciona em cobrança ainda não paga.
 */
export async function updateAsaasPaymentValue(paymentId: string, value: number): Promise<void> {
  await asaasFetch(`/payments/${paymentId}`, {
    method: "PUT",
    body: JSON.stringify({ value }),
  });
}

/**
 * Troca o valor/ciclo de uma assinatura existente (usado quando o usuário
 * troca de plano - Pro<->Elite ou mensal<->anual - sem cancelar e criar
 * assinatura nova). `updatePendingPayments: true` faz a cobrança que já
 * tinha sido gerada mas ainda não foi paga (a do trial, por exemplo)
 * também refletir o novo valor - sem isso, o Asaas só aplicaria a mudança
 * a partir da cobrança seguinte, cobrando o valor antigo uma última vez.
 * Sem proporcionalidade: a troca vale o valor cheio na próxima cobrança,
 * sem calcular crédito do período já corrido no plano antigo.
 */
export async function updateAsaasSubscriptionValue(
  subscriptionId: string,
  params: { value: number; cycle: BillingCycle }
): Promise<void> {
  await asaasFetch(`/subscriptions/${subscriptionId}`, {
    method: "PUT",
    body: JSON.stringify({
      value: params.value,
      cycle: params.cycle === "annual" ? "YEARLY" : "MONTHLY",
      updatePendingPayments: true,
    }),
  });
}

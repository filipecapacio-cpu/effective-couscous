/**
 * Integração com a API do Asaas (https://docs.asaas.com).
 *
 * Variáveis de ambiente necessárias (definir na Vercel e em .env.local):
 * - ASAAS_API_KEY: chave de API (sandbox ou produção)
 * - ASAAS_ENV: "sandbox" | "production" (default: "sandbox")
 * - ASAAS_PLAN_VALUE: valor da assinatura em reais, ex. "39.90"
 * - ASAAS_WEBHOOK_TOKEN: token que você define ao configurar o webhook no
 *   Asaas (Configurações -> Integrações -> Webhooks). O Asaas devolve esse
 *   token no header "asaas-access-token" em toda chamada ao seu webhook —
 *   é assim que confirmamos que a chamada realmente veio do Asaas.
 */

const ASAAS_BASE_URL =
  process.env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";

function apiKey(): string {
  const key = process.env.ASAAS_API_KEY;
  if (!key) {
    throw new Error("ASAAS_API_KEY não configurada.");
  }
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

export type AsaasCustomer = {
  id: string;
  name: string;
  email: string;
};

/** Cria (ou reaproveita) um cliente no Asaas para o usuário do Onmode. */
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

export type AsaasPayment = {
  id: string;
  status: string;
  invoiceUrl: string;
};

/**
 * Cria uma cobrança única (o pagador escolhe Pix, boleto ou cartão na
 * própria página do Asaas). `invoiceUrl` é o link de checkout hospedado
 * pelo Asaas pra onde redirecionamos o usuário recém-cadastrado.
 */
export async function createAsaasPayment(params: {
  customerId: string;
  externalReference: string;
  description?: string;
}): Promise<AsaasPayment> {
  const value = Number(process.env.ASAAS_PLAN_VALUE ?? "0");
  if (!value) {
    throw new Error("ASAAS_PLAN_VALUE não configurada ou inválida.");
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 2);

  return asaasFetch<AsaasPayment>("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: params.customerId,
      billingType: "UNDEFINED",
      value,
      dueDate: dueDate.toISOString().slice(0, 10),
      description: params.description ?? "Assinatura Onmode",
      externalReference: params.externalReference,
    }),
  });
}

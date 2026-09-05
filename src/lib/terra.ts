import { createHmac, timingSafeEqual } from "crypto";

/**
 * Integração com a Terra API (https://tryterra.co) — conecta wearables
 * (hoje: Garmin) via um widget hospedado pela própria Terra (ela cuida do
 * OAuth inteiro; o Onmode nunca vê a senha do usuário) e recebe sono, FC de
 * repouso, body battery e estresse de forma assíncrona por webhook.
 *
 * Variáveis de ambiente (definir na Vercel e em .env.local):
 * - TERRA_DEV_ID: seu dev_id (crie uma conta developer em tryterra.co)
 * - TERRA_API_KEY: sua x-api-key
 * - TERRA_SIGNING_SECRET: secret usado pra validar a assinatura HMAC (header
 *   "terra-signature") de todo webhook recebido em /api/webhooks/terra —
 *   sem isso, qualquer um poderia postar dados falsos nesse endpoint.
 *
 * Docs oficiais: https://docs.tryterra.co/reference — os endpoints abaixo
 * foram confirmados nessa referência em 2026, mas a Terra já mudou
 * path/campo entre versões no passado; reconfira antes de ir pra produção.
 */

const TERRA_BASE_URL = "https://api.tryterra.co/v2";

export function isTerraConfigured(): boolean {
  return Boolean(process.env.TERRA_DEV_ID && process.env.TERRA_API_KEY);
}

function authHeaders(): Record<string, string> {
  const devId = process.env.TERRA_DEV_ID;
  const apiKey = process.env.TERRA_API_KEY;
  if (!devId || !apiKey) {
    throw new Error("Terra não configurada: defina TERRA_DEV_ID e TERRA_API_KEY.");
  }
  return { "dev-id": devId, "x-api-key": apiKey, "Content-Type": "application/json" };
}

async function terraFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${TERRA_BASE_URL}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Terra ${path} falhou (${res.status}): ${body}`);
  }

  return res.json() as Promise<T>;
}

export type TerraWidgetSession = {
  status: string;
  session_id: string;
  url: string;
  expires_in: number;
};

/**
 * Gera a URL do Connection Widget hospedado pela Terra: o usuário abre essa
 * URL, escolhe "Garmin" e faz login lá dentro. `referenceId` é o auth.uid()
 * do Supabase do usuário logado — é essa referência que o webhook de
 * confirmação (`type: "auth"`) devolve junto com o user_id da Terra,
 * permitindo linkar os dois lados (ver src/app/api/webhooks/terra/route.ts).
 */
export async function createWidgetSession(params: {
  referenceId: string;
  successRedirectUrl: string;
  failureRedirectUrl: string;
}): Promise<TerraWidgetSession> {
  return terraFetch<TerraWidgetSession>("/auth/generateWidgetSession", {
    method: "POST",
    body: JSON.stringify({
      reference_id: params.referenceId,
      providers: "GARMIN",
      auth_success_redirect_url: params.successRedirectUrl,
      auth_failure_redirect_url: params.failureRedirectUrl,
      language: "pt",
    }),
  });
}

/**
 * Revoga o acesso do lado da Terra (ela cuida de desfazer o OAuth com o
 * provider). O webhook `type: "deauth"` cobre o caso do usuário desconectar
 * direto pela Garmin/Terra em vez de pelo Onmode — os dois caminhos levam
 * ao mesmo lugar (garmin_status = "disconnected").
 */
export async function deauthenticateUser(terraUserId: string): Promise<void> {
  await terraFetch(`/auth/deauthenticateUser?user_id=${encodeURIComponent(terraUserId)}`, {
    method: "POST",
  });
}

const HISTORICAL_METRIC_TYPES = ["sleep", "daily", "activity"] as const;

/**
 * Pede o histórico dos últimos `days` dias pro usuário recém-conectado. Não
 * existe um endpoint único "puxa tudo" — a Terra expõe um GET por tipo de
 * dado (sleep/daily/activity/...); com `to_webhook=true` os resultados
 * voltam de forma assíncrona pro mesmo webhook que trata os eventos normais,
 * então não precisamos de um handler separado pra isso. Chamado uma vez, na
 * primeira conexão (ver connectGarmin em src/app/actions/wearables.ts).
 */
export async function requestHistoricalData(terraUserId: string, days: number): Promise<void> {
  const endDate = new Date().toISOString().slice(0, 10);
  const start = new Date();
  start.setDate(start.getDate() - days);
  const startDate = start.toISOString().slice(0, 10);

  await Promise.all(
    HISTORICAL_METRIC_TYPES.map((metricType) =>
      terraFetch(
        `/${metricType}?user_id=${encodeURIComponent(terraUserId)}&start_date=${startDate}&end_date=${endDate}&to_webhook=true`,
        { method: "GET" }
      )
    )
  );
}

/**
 * Valida a assinatura HMAC do webhook. Header `terra-signature` no formato
 * `t=<timestamp>,v1=<hex>`; a mensagem assinada é `${timestamp}.${rawBody}`
 * em HMAC-SHA256 com o TERRA_SIGNING_SECRET, comparada em tempo constante.
 *
 * Importante: precisa do corpo bruto (string), não do JSON já parseado —
 * reserializar o objeto não reproduz com garantia os bytes originais que a
 * Terra assinou. Por isso o route handler chama `request.text()` antes de
 * fazer `JSON.parse`.
 */
export function verifyTerraSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.TERRA_SIGNING_SECRET;
  if (!secret || !signatureHeader) return false;

  const parts: Record<string, string> = {};
  for (const part of signatureHeader.split(",")) {
    const [key, value] = part.split("=");
    if (key && value) parts[key] = value;
  }

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const signatureBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== signatureBuf.length) return false;

  return timingSafeEqual(expectedBuf, signatureBuf);
}

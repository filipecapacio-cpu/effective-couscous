import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTerraSignature, requestHistoricalData } from "@/lib/terra";

// A verificação de assinatura usa node:crypto — precisa do runtime Node
// (Edge não tem createHmac/timingSafeEqual).
export const runtime = "nodejs";

const HISTORICAL_BACKFILL_DAYS = 30;

type TerraWebhookPayload = {
  type?: string;
  user?: { user_id?: string; reference_id?: string };
  data?: Record<string, unknown>[];
};

// https://docs.tryterra.co/reference (webhooks + verificação de assinatura)
export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("terra-signature");

  if (!verifyTerraSignature(rawBody, signature)) {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
  }

  let payload: TerraWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "payload inválido" }, { status: 400 });
  }

  const type = payload.type;
  const terraUserId = payload.user?.user_id;
  const referenceId = payload.user?.reference_id;
  const supabase = createAdminClient();

  switch (type) {
    case "auth":
      return handleAuth(supabase, referenceId, terraUserId);
    case "deauth":
      return handleDeauth(supabase, terraUserId);
    case "sleep":
    case "daily":
    case "activity":
      return handleData(supabase, type, terraUserId, payload);
    default:
      // Outros tipos (ex.: "body", "nutrition", "menstruation", "connection_error")
      // são ignorados por enquanto - sem devolver erro, senão a Terra reentrega
      // o mesmo evento em loop achando que falhamos em processá-lo.
      return NextResponse.json({ ok: true, ignored: type ?? "sem type" });
  }
}

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Confirma a conexão: liga o user_id da Terra ao profile do Onmode (achado
 * pelo reference_id = auth.uid(), que mandamos ao gerar o widget session em
 * src/app/actions/wearables.ts) e dispara o pedido de histórico retroativo
 * pra já popular o dashboard no mesmo dia.
 */
async function handleAuth(supabase: AdminClient, referenceId: string | undefined, terraUserId: string | undefined) {
  if (!referenceId || !terraUserId) {
    return NextResponse.json({ ok: true, ignored: "auth sem reference_id/user_id" });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      garmin_terra_user_id: terraUserId,
      garmin_status: "connected",
      garmin_connected_at: new Date().toISOString(),
      garmin_disconnected_at: null,
    })
    .eq("id", referenceId);

  if (error) {
    console.error("[terra webhook] failed to link user:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    await requestHistoricalData(terraUserId, HISTORICAL_BACKFILL_DAYS);
  } catch (err) {
    // Não falha o webhook por isso - a conexão já foi salva; o pior caso é
    // o usuário ver o dashboard vazio até o primeiro dado novo chegar.
    console.error("[terra webhook] historical backfill request failed:", err);
  }

  return NextResponse.json({ ok: true });
}

/** Usuário desconectou do lado da Garmin/Terra - limpa o status local. */
async function handleDeauth(supabase: AdminClient, terraUserId: string | undefined) {
  if (!terraUserId) return NextResponse.json({ ok: true, ignored: "deauth sem user_id" });

  const { error } = await supabase
    .from("profiles")
    .update({ garmin_status: "disconnected", garmin_disconnected_at: new Date().toISOString() })
    .eq("garmin_terra_user_id", terraUserId);

  if (error) {
    console.error("[terra webhook] failed to mark disconnected:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function handleData(
  supabase: AdminClient,
  type: "sleep" | "daily" | "activity",
  terraUserId: string | undefined,
  payload: TerraWebhookPayload
) {
  if (!terraUserId) return NextResponse.json({ ok: true, ignored: `${type} sem user_id` });

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("garmin_terra_user_id", terraUserId)
    .maybeSingle();

  if (!profile) {
    // Pode chegar dado de um user_id que ainda não linkamos (ex.: race
    // condition entre o webhook "auth" e o primeiro dado) - ignora sem
    // erro, a Terra reenvia dados novos naturalmente depois.
    return NextResponse.json({ ok: true, ignored: "user_id não linkado a nenhum perfil" });
  }

  const records = Array.isArray(payload.data) ? payload.data : [];
  const rows = records.flatMap((record) => buildWearableRows(profile.id, type, record, payload));

  if (rows.length === 0) {
    return NextResponse.json({ ok: true, ignored: "sem métricas reconhecidas" });
  }

  const { error } = await supabase
    .from("wearable_data")
    .upsert(rows, { onConflict: "user_id,date,source,metric_type" });

  if (error) {
    console.error(`[terra webhook] failed to save ${type} data:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, saved: rows.length });
}

function extractDateISO(record: Record<string, unknown>): string | null {
  const metadata = record.metadata as Record<string, unknown> | undefined;
  const raw = metadata?.summary_date ?? metadata?.start_time ?? metadata?.end_time;
  return typeof raw === "string" ? raw.slice(0, 10) : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function get(record: Record<string, unknown>, ...path: string[]): unknown {
  let cur: unknown = record;
  for (const key of path) {
    if (typeof cur !== "object" || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

/**
 * Mapeia um registro (um dia) do payload da Terra pros nossos metric_type.
 * Os caminhos abaixo seguem o schema unificado documentado em
 * https://docs.tryterra.co/reference, mas "body battery" é um recurso
 * proprietário da Garmin sem campo unificado confirmado - valide esse
 * caminho contra um payload real de sandbox antes de confiar nele em
 * produção (ver README, seção "Testando em sandbox").
 */
function buildWearableRows(
  userId: string,
  type: "sleep" | "daily" | "activity",
  record: Record<string, unknown>,
  rawPayload: unknown
): { user_id: string; date: string; source: string; metric_type: string; value: number; raw_payload: unknown }[] {
  const date = extractDateISO(record);
  if (!date) return [];

  const metrics: { metric_type: string; value: number }[] = [];

  if (type === "sleep") {
    const sleepScore = num(get(record, "sleep_durations_data", "other", "sleep_efficiency"));
    if (sleepScore !== null) metrics.push({ metric_type: "sleep_score", value: sleepScore });

    const asleepSeconds = num(get(record, "sleep_durations_data", "asleep", "duration_asleep_state_seconds"));
    if (asleepSeconds !== null) {
      metrics.push({ metric_type: "sleep_duration_min", value: Math.round(asleepSeconds / 60) });
    }
  }

  if (type === "daily") {
    const restingHr = num(get(record, "heart_rate_data", "summary", "resting_hr_bpm"));
    if (restingHr !== null) metrics.push({ metric_type: "resting_hr_bpm", value: restingHr });

    const stress = num(get(record, "stress_data", "avg_stress_level"));
    if (stress !== null) metrics.push({ metric_type: "stress_level", value: stress });

    const bodyBattery = num(get(record, "body_battery_data", "body_battery"));
    if (bodyBattery !== null) metrics.push({ metric_type: "body_battery", value: bodyBattery });
  }

  if (type === "activity") {
    const calories = num(get(record, "calories_data", "total_burned_calories"));
    if (calories !== null) metrics.push({ metric_type: "calories", value: calories });

    const steps = num(get(record, "distance_data", "steps"));
    if (steps !== null) metrics.push({ metric_type: "steps", value: steps });
  }

  return metrics.map((m) => ({
    user_id: userId,
    date,
    source: "garmin",
    metric_type: m.metric_type,
    value: m.value,
    raw_payload: rawPayload,
  }));
}

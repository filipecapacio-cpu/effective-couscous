import { createClient } from "@/lib/supabase/server";
import { addDaysISO, todayISO } from "@/lib/date";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type GarminConnection = {
  status: "connected" | "disconnected";
  terraUserId: string | null;
  connectedAt: string | null;
};

/** Estado atual da conexão com o Garmin, direto do profile. */
export async function getGarminConnection(supabase: Supabase, userId: string): Promise<GarminConnection> {
  const { data } = await supabase
    .from("profiles")
    .select("garmin_status, garmin_terra_user_id, garmin_connected_at")
    .eq("id", userId)
    .single();

  return {
    status: (data?.garmin_status as "connected" | "disconnected" | null) ?? "disconnected",
    terraUserId: data?.garmin_terra_user_id ?? null,
    connectedAt: data?.garmin_connected_at ?? null,
  };
}

export type WearableSnapshot = {
  date: string;
  sleepScore: number | null;
  sleepDurationMin: number | null;
  restingHrBpm: number | null;
  bodyBattery: number | null;
  stressLevel: number | null;
};

/** Métricas do dia mais recente disponível na wearable_data (até 2 dias atrás). */
export async function getLatestWearableSnapshot(
  supabase: Supabase,
  userId: string
): Promise<WearableSnapshot | null> {
  const sinceISO = addDaysISO(todayISO(), -2);

  const { data, error } = await supabase
    .from("wearable_data")
    .select("date, metric_type, value")
    .eq("user_id", userId)
    .gte("date", sinceISO)
    .order("date", { ascending: false });

  if (error) {
    console.error("[getLatestWearableSnapshot] failed:", error);
    return null;
  }
  if (!data || data.length === 0) return null;

  const latestDate = data[0].date as string;
  const byMetric = new Map(
    data.filter((row) => row.date === latestDate).map((row) => [row.metric_type as string, row.value as number | null])
  );

  return {
    date: latestDate,
    sleepScore: byMetric.get("sleep_score") ?? null,
    sleepDurationMin: byMetric.get("sleep_duration_min") ?? null,
    restingHrBpm: byMetric.get("resting_hr_bpm") ?? null,
    bodyBattery: byMetric.get("body_battery") ?? null,
    stressLevel: byMetric.get("stress_level") ?? null,
  };
}

/**
 * Proxy de fadiga a partir dos registros manuais de treino (intensidade
 * 1-10 que o usuário dá em cada treino, ver src/app/actions/workoutLog.ts) -
 * hoje é o único "registro manual" que o app coleta; se um dia existir uma
 * pergunta direta de fadiga/energia, ela entra aqui no lugar/junto disso.
 * Treino intenso recente reduz o score; sem registro nos últimos 2 dias,
 * retorna null (sem opinião).
 */
export async function getManualFatigueSignal(supabase: Supabase, userId: string): Promise<number | null> {
  const sinceISO = addDaysISO(todayISO(), -2);

  const { data } = await supabase
    .from("workout_logs")
    .select("intensity_score, modality")
    .eq("user_id", userId)
    .gte("date", sinceISO);

  const scored = (data ?? []).filter(
    (log) => log.modality !== "Descanso" && typeof log.intensity_score === "number"
  );
  if (scored.length === 0) return null;

  const avgIntensity = scored.reduce((sum, log) => sum + (log.intensity_score as number), 0) / scored.length;
  return Math.max(0, Math.min(100, Math.round(100 - avgIntensity * 7)));
}

export type ReadinessResult = { score: number; source: "wearable" | "manual" | "combined" } | null;

/**
 * Prontidão (0-100): combina o wearable (quando conectado) com o proxy
 * manual. Prioridade: os dois juntos quando disponíveis (70% wearable / 30%
 * manual - o sensor pesa mais, mas o auto-relato do treino recente ainda
 * ajusta o número); só wearable ou só manual quando falta um dos dois;
 * `null` quando não há nenhum dado ainda. Pesos são um ponto de partida -
 * ajuste depois de comparar com a percepção real dos usuários.
 */
export function computeReadinessScore(
  wearable: WearableSnapshot | null,
  manualFatigue: number | null
): ReadinessResult {
  const wearableParts = wearable
    ? [wearable.sleepScore, wearable.bodyBattery, wearable.stressLevel !== null ? 100 - wearable.stressLevel : null].filter(
        (v): v is number => v !== null
      )
    : [];
  const wearableScore =
    wearableParts.length > 0 ? wearableParts.reduce((a, b) => a + b, 0) / wearableParts.length : null;

  if (wearableScore !== null && manualFatigue !== null) {
    return { score: Math.round(wearableScore * 0.7 + manualFatigue * 0.3), source: "combined" };
  }
  if (wearableScore !== null) return { score: Math.round(wearableScore), source: "wearable" };
  if (manualFatigue !== null) return { score: manualFatigue, source: "manual" };
  return null;
}

/** Snapshot + score de prontidão já combinados, pronto pra tela. */
export async function getReadinessSnapshot(supabase: Supabase, userId: string) {
  const [wearable, manualFatigue] = await Promise.all([
    getLatestWearableSnapshot(supabase, userId),
    getManualFatigueSignal(supabase, userId),
  ]);

  return { wearable, result: computeReadinessScore(wearable, manualFatigue) };
}

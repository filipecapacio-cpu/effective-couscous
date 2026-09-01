import { createClient } from "@/lib/supabase/server";
import { computeStreak } from "@/lib/plan";
import { addDaysISO, todayISO } from "@/lib/date";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export { todayISO };

/** Sequência de dias com o treino totalmente concluído, olhando os últimos 30 dias. */
export async function getStreak(supabase: Supabase, userId: string): Promise<number> {
  const today = todayISO();
  const sinceISO = addDaysISO(today, -30);

  const { data } = await supabase
    .from("workouts")
    .select("date, workout_exercises(done)")
    .eq("user_id", userId)
    .gte("date", sinceISO);

  const days = (data ?? []).map((w) => {
    const list = (w.workout_exercises ?? []) as { done: boolean }[];
    return {
      date: w.date as string,
      hasExercises: list.length > 0,
      allDone: list.length > 0 && list.every((e) => e.done),
    };
  });

  return computeStreak(days, today);
}

/** Resumo dos últimos 7 dias (incluindo hoje) para a tela de perfil. */
export async function getWeekSummary(supabase: Supabase, userId: string) {
  const sinceISO = addDaysISO(todayISO(), -6);

  const { data: workouts } = await supabase
    .from("workouts")
    .select("date, workout_exercises(done)")
    .eq("user_id", userId)
    .gte("date", sinceISO);

  const days = workouts ?? [];
  const withPlan = days.filter((w) => (w.workout_exercises?.length ?? 0) > 0);
  const completed = withPlan.filter((w) =>
    (w.workout_exercises as { done: boolean }[]).every((e) => e.done)
  );

  const consistency = withPlan.length > 0 ? Math.round((completed.length / withPlan.length) * 100) : 0;

  return {
    daysWithPlan: withPlan.length,
    workoutsCompleted: completed.length,
    consistency,
    sinceISO,
  };
}

export type WeeklyLoadDay = { date: string; modality: string | null; durationMin: number | null };

/** Treino efetivamente registrado (workout_logs) nos últimos 7 dias, incluindo hoje. */
export async function getWeeklyLoad(supabase: Supabase, userId: string): Promise<WeeklyLoadDay[]> {
  const sinceISO = addDaysISO(todayISO(), -6);

  const { data, error } = await supabase
    .from("workout_logs")
    .select("date, modality, duration_min")
    .eq("user_id", userId)
    .gte("date", sinceISO);

  if (error) {
    console.error("[getWeeklyLoad] failed:", error);
  }

  const byDate = new Map(
    (data ?? []).map((row) => [row.date as string, { modality: row.modality as string, durationMin: row.duration_min as number | null }])
  );

  const days: WeeklyLoadDay[] = [];
  for (let i = 0; i < 7; i++) {
    const key = addDaysISO(sinceISO, i);
    const entry = byDate.get(key);
    days.push({ date: key, modality: entry?.modality ?? null, durationMin: entry?.durationMin ?? null });
  }
  return days;
}

export type HeatmapDay = { date: string; status: "done" | "planned" | "none" };

/** Últimos 28 dias (mais antigo primeiro) para o histórico visual do perfil. */
export async function getMonthHeatmap(supabase: Supabase, userId: string): Promise<HeatmapDay[]> {
  const sinceISO = addDaysISO(todayISO(), -27);

  const { data } = await supabase
    .from("workouts")
    .select("date, workout_exercises(done)")
    .eq("user_id", userId)
    .gte("date", sinceISO);

  const byDate = new Map(
    (data ?? []).map((w) => {
      const list = (w.workout_exercises ?? []) as { done: boolean }[];
      const status: HeatmapDay["status"] =
        list.length === 0 ? "none" : list.every((e) => e.done) ? "done" : "planned";
      return [w.date as string, status];
    })
  );

  const days: HeatmapDay[] = [];
  for (let i = 0; i < 28; i++) {
    const key = addDaysISO(sinceISO, i);
    days.push({ date: key, status: byDate.get(key) ?? "none" });
  }
  return days;
}

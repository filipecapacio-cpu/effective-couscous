import { createClient } from "@/lib/supabase/server";
import { computeStreak } from "@/lib/plan";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export const todayISO = () => new Date().toISOString().slice(0, 10);

/** Sequência de dias com o treino totalmente concluído, olhando os últimos 30 dias. */
export async function getStreak(supabase: Supabase, userId: string): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data } = await supabase
    .from("workouts")
    .select("date, workout_exercises(done)")
    .eq("user_id", userId)
    .gte("date", since.toISOString().slice(0, 10));

  const days = (data ?? []).map((w) => {
    const list = (w.workout_exercises ?? []) as { done: boolean }[];
    return {
      date: w.date as string,
      hasExercises: list.length > 0,
      allDone: list.length > 0 && list.every((e) => e.done),
    };
  });

  return computeStreak(days);
}

/** Resumo dos últimos 7 dias (incluindo hoje) para a tela de perfil. */
export async function getWeekSummary(supabase: Supabase, userId: string) {
  const since = new Date();
  since.setDate(since.getDate() - 6);
  const sinceISO = since.toISOString().slice(0, 10);

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

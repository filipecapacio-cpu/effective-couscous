"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STARTER_EXERCISES, STARTER_MEALS, starterWorkoutTitle, type Goal } from "@/lib/plan";
import { dayPlanFor, type WeekPlan } from "@/lib/ai-plan";
import { todayISO } from "@/lib/date";

type Supabase = Awaited<ReturnType<typeof createClient>>;

type DayContent = {
  title: string;
  durationMin: number | null;
  exercises: { name: string; detail: string | null }[];
  meals: { name: string; detail: string | null; kcal: number | null }[];
};

function starterContent(goal: Goal | null): DayContent {
  return {
    title: starterWorkoutTitle(goal),
    durationMin: 40,
    exercises: STARTER_EXERCISES,
    meals: STARTER_MEALS.map((name) => ({ name, detail: null, kcal: null })),
  };
}

function aiContent(plan: WeekPlan, date: string): DayContent {
  const day = dayPlanFor(plan, date);
  return {
    title: day.restDay ? "Descanso" : day.workoutTitle,
    durationMin: day.restDay ? null : day.durationMin,
    exercises: day.restDay ? [] : day.exercises,
    meals: day.meals,
  };
}

/** Garante que existe um treino e refeições planejadas para hoje. Idempotente. */
export async function ensureTodayPlan(userId: string, goal: Goal | null) {
  const supabase = await createClient();
  const date = todayISO();

  // As três checagens são independentes — roda em paralelo pra não pagar
  // viagens de rede em série.
  const [
    { data: existingWorkout, error: existingWorkoutError },
    { data: existingMeals, error: existingMealsError },
    { data: aiPlanRow },
  ] = await Promise.all([
    supabase.from("workouts").select("id").eq("user_id", userId).eq("date", date).maybeSingle(),
    supabase.from("meals").select("id").eq("user_id", userId).eq("date", date).limit(1),
    supabase.from("ai_plans").select("plan").eq("user_id", userId).maybeSingle(),
  ]);

  if (existingWorkoutError) {
    console.error("[ensureTodayPlan] failed to read today's workout:", existingWorkoutError);
  }
  if (existingMealsError) {
    console.error("[ensureTodayPlan] failed to read today's meals:", existingMealsError);
  }

  if (existingWorkout && existingMeals && existingMeals.length > 0) return;

  const content = aiPlanRow?.plan
    ? aiContent(aiPlanRow.plan as WeekPlan, date)
    : starterContent(goal);

  await Promise.all([
    existingWorkout
      ? Promise.resolve()
      : insertDayContentWorkoutOnly(supabase, userId, date, content),
    existingMeals && existingMeals.length > 0
      ? Promise.resolve()
      : insertDayContentMealsOnly(supabase, userId, date, content),
  ]);
}

async function insertDayContentWorkoutOnly(
  supabase: Supabase,
  userId: string,
  date: string,
  content: DayContent
) {
  const { data: workout, error } = await supabase
    .from("workouts")
    .insert({ user_id: userId, date, title: content.title, duration_min: content.durationMin })
    .select("id")
    .single();
  if (error) {
    console.error("[ensureTodayPlan] failed to insert workout:", error);
    return;
  }
  if (workout && content.exercises.length > 0) {
    const { error: exercisesError } = await supabase.from("workout_exercises").insert(
      content.exercises.map((ex, i) => ({
        workout_id: workout.id,
        name: ex.name,
        detail: ex.detail,
        position: i,
      }))
    );
    if (exercisesError) {
      console.error("[ensureTodayPlan] failed to insert workout_exercises:", exercisesError);
    }
  }
}

async function insertDayContentMealsOnly(
  supabase: Supabase,
  userId: string,
  date: string,
  content: DayContent
) {
  if (content.meals.length === 0) return;
  const { error } = await supabase.from("meals").insert(
    content.meals.map((m, i) => ({
      user_id: userId,
      date,
      name: m.name,
      detail: m.detail,
      kcal: m.kcal,
      position: i,
    }))
  );
  if (error) {
    console.error("[ensureTodayPlan] failed to insert meals:", error);
  }
}

/**
 * Substitui de vez o treino/refeições de hoje pelo conteúdo do plano de IA
 * recém-gerado — ao contrário de ensureTodayPlan, isso é intencional e
 * sobrescreve o que já existir (chamado só logo após gerar um plano novo).
 */
export async function replaceTodayPlanWithAiPlan(userId: string, plan: WeekPlan) {
  const supabase = await createClient();
  const date = todayISO();

  const { data: existingWorkout } = await supabase
    .from("workouts")
    .select("id")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  await Promise.all([
    existingWorkout
      ? supabase.from("workouts").delete().eq("id", existingWorkout.id)
      : Promise.resolve(),
    supabase.from("meals").delete().eq("user_id", userId).eq("date", date),
  ]);

  const content = aiContent(plan, date);
  await Promise.all([
    insertDayContentWorkoutOnly(supabase, userId, date, content),
    insertDayContentMealsOnly(supabase, userId, date, content),
  ]);
}

/**
 * Substitui só as refeições de HOJE - não mexe no treino. Usado pelo assistente
 * de IA quando o usuário pede pra lançar/atualizar a dieta direto pelo chat,
 * sem passar pela anamnese/plano semanal inteiro.
 */
export async function replaceTodayMealsOnly(
  userId: string,
  meals: { name: string; detail: string | null; kcal: number | null }[]
): Promise<{ error: string } | { ok: true }> {
  const supabase = await createClient();
  const date = todayISO();

  const { error: deleteError } = await supabase
    .from("meals")
    .delete()
    .eq("user_id", userId)
    .eq("date", date);
  if (deleteError) {
    console.error("[replaceTodayMealsOnly] failed to clear today's meals:", deleteError);
    return { error: "Não deu pra substituir as refeições de hoje." };
  }

  if (meals.length === 0) return { ok: true };

  const { error: insertError } = await supabase.from("meals").insert(
    meals.map((m, i) => ({
      user_id: userId,
      date,
      name: m.name,
      detail: m.detail,
      kcal: m.kcal,
      position: i,
    }))
  );
  if (insertError) {
    console.error("[replaceTodayMealsOnly] failed to insert meals:", insertError);
    return { error: "As refeições não salvaram." };
  }

  revalidatePath("/plano");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Aplica o objetivo escolhido no onboarding assim que a conta é confirmada. */
export async function completeOnboarding(userId: string, goal: Goal) {
  const supabase = await createClient();
  const [{ error }] = await Promise.all([
    supabase.from("profiles").update({ goal }).eq("id", userId),
    ensureTodayPlan(userId, goal),
  ]);
  if (error) {
    console.error("[completeOnboarding] failed to save goal:", error);
  }
}

export async function toggleExercise(id: string, done: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("workout_exercises").update({ done }).eq("id", id);
  if (error) {
    console.error("[toggleExercise] failed:", error);
  }
  revalidatePath("/plano");
  revalidatePath("/dashboard");
}

export async function toggleMeal(id: string, done: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("meals").update({ done }).eq("id", id);
  if (error) {
    console.error("[toggleMeal] failed:", error);
  }
  revalidatePath("/plano");
  revalidatePath("/dashboard");
}

async function nextPosition(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "workout_exercises" | "meals",
  match: Record<string, string>
) {
  const { data } = await supabase
    .from(table)
    .select("position")
    .match(match)
    .order("position", { ascending: false })
    .limit(1);
  return (data?.[0]?.position ?? -1) + 1;
}

export async function addExercise(workoutId: string, name: string, detail: string | null) {
  if (!name.trim()) return;
  const supabase = await createClient();
  const position = await nextPosition(supabase, "workout_exercises", { workout_id: workoutId });
  const { error } = await supabase
    .from("workout_exercises")
    .insert({ workout_id: workoutId, name: name.trim(), detail, position });
  if (error) console.error("[addExercise] failed:", error);
  revalidatePath("/plano");
  revalidatePath("/dashboard");
}

export async function updateExercise(id: string, name: string, detail: string | null) {
  if (!name.trim()) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("workout_exercises")
    .update({ name: name.trim(), detail })
    .eq("id", id);
  if (error) console.error("[updateExercise] failed:", error);
  revalidatePath("/plano");
  revalidatePath("/dashboard");
}

export async function deleteExercise(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("workout_exercises").delete().eq("id", id);
  if (error) console.error("[deleteExercise] failed:", error);
  revalidatePath("/plano");
  revalidatePath("/dashboard");
}

export async function addMeal(userId: string, name: string, detail: string | null, kcal: number | null) {
  if (!name.trim()) return;
  const supabase = await createClient();
  const date = todayISO();
  const position = await nextPosition(supabase, "meals", { user_id: userId, date });
  const { error } = await supabase
    .from("meals")
    .insert({ user_id: userId, date, name: name.trim(), detail, kcal, position });
  if (error) console.error("[addMeal] failed:", error);
  revalidatePath("/plano");
  revalidatePath("/dashboard");
}

export async function updateMeal(id: string, name: string, detail: string | null, kcal: number | null) {
  if (!name.trim()) return;
  const supabase = await createClient();
  const { error } = await supabase
    .from("meals")
    .update({ name: name.trim(), detail, kcal })
    .eq("id", id);
  if (error) console.error("[updateMeal] failed:", error);
  revalidatePath("/plano");
  revalidatePath("/dashboard");
}

export async function deleteMeal(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("meals").delete().eq("id", id);
  if (error) console.error("[deleteMeal] failed:", error);
  revalidatePath("/plano");
  revalidatePath("/dashboard");
}

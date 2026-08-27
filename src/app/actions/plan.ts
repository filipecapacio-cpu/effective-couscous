"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STARTER_EXERCISES, STARTER_MEALS, starterWorkoutTitle, type Goal } from "@/lib/plan";

const todayISO = () => new Date().toISOString().slice(0, 10);

/** Garante que existe um treino e refeições planejadas para hoje. Idempotente. */
export async function ensureTodayPlan(userId: string, goal: Goal | null) {
  const supabase = await createClient();
  const date = todayISO();

  const { data: existingWorkout } = await supabase
    .from("workouts")
    .select("id")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (!existingWorkout) {
    const { data: workout, error } = await supabase
      .from("workouts")
      .insert({ user_id: userId, date, title: starterWorkoutTitle(goal), duration_min: 40 })
      .select("id")
      .single();

    if (!error && workout) {
      await supabase.from("workout_exercises").insert(
        STARTER_EXERCISES.map((ex, i) => ({
          workout_id: workout.id,
          name: ex.name,
          detail: ex.detail,
          position: i,
        }))
      );
    }
  }

  const { data: existingMeals } = await supabase
    .from("meals")
    .select("id")
    .eq("user_id", userId)
    .eq("date", date)
    .limit(1);

  if (!existingMeals || existingMeals.length === 0) {
    await supabase.from("meals").insert(
      STARTER_MEALS.map((name, i) => ({ user_id: userId, date, name, position: i }))
    );
  }
}

/** Aplica o objetivo escolhido no onboarding assim que a conta é confirmada. */
export async function completeOnboarding(userId: string, goal: Goal) {
  const supabase = await createClient();
  await supabase.from("profiles").update({ goal }).eq("id", userId);
  await ensureTodayPlan(userId, goal);
}

export async function toggleExercise(id: string, done: boolean) {
  const supabase = await createClient();
  await supabase.from("workout_exercises").update({ done }).eq("id", id);
  revalidatePath("/plano");
  revalidatePath("/dashboard");
}

export async function toggleMeal(id: string, done: boolean) {
  const supabase = await createClient();
  await supabase.from("meals").update({ done }).eq("id", id);
  revalidatePath("/plano");
  revalidatePath("/dashboard");
}

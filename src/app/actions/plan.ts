"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STARTER_EXERCISES, STARTER_MEALS, starterWorkoutTitle, type Goal } from "@/lib/plan";

const todayISO = () => new Date().toISOString().slice(0, 10);

/** Garante que existe um treino e refeições planejadas para hoje. Idempotente. */
export async function ensureTodayPlan(userId: string, goal: Goal | null) {
  const supabase = await createClient();
  const date = todayISO();

  // As duas checagens de existência são independentes — roda em paralelo
  // pra não pagar duas viagens de rede em série.
  const [
    { data: existingWorkout, error: existingWorkoutError },
    { data: existingMeals, error: existingMealsError },
  ] = await Promise.all([
    supabase.from("workouts").select("id").eq("user_id", userId).eq("date", date).maybeSingle(),
    supabase.from("meals").select("id").eq("user_id", userId).eq("date", date).limit(1),
  ]);

  if (existingWorkoutError) {
    console.error("[ensureTodayPlan] failed to read today's workout:", existingWorkoutError);
  }
  if (existingMealsError) {
    console.error("[ensureTodayPlan] failed to read today's meals:", existingMealsError);
  }

  const seedMeals = async () => {
    if (existingMeals && existingMeals.length > 0) return;
    const { error: mealsError } = await supabase.from("meals").insert(
      STARTER_MEALS.map((name, i) => ({ user_id: userId, date, name, position: i }))
    );
    if (mealsError) {
      console.error("[ensureTodayPlan] failed to insert meals:", mealsError);
    }
  };

  const seedWorkout = async () => {
    if (existingWorkout) return;
    const { data: workout, error } = await supabase
      .from("workouts")
      .insert({ user_id: userId, date, title: starterWorkoutTitle(goal), duration_min: 40 })
      .select("id")
      .single();

    if (error) {
      console.error("[ensureTodayPlan] failed to insert workout:", error);
    } else if (workout) {
      const { error: exercisesError } = await supabase.from("workout_exercises").insert(
        STARTER_EXERCISES.map((ex, i) => ({
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
  };

  await Promise.all([seedWorkout(), seedMeals()]);
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

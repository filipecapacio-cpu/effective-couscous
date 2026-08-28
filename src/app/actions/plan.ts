"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { STARTER_EXERCISES, STARTER_MEALS, starterWorkoutTitle, type Goal } from "@/lib/plan";

const todayISO = () => new Date().toISOString().slice(0, 10);

/** Garante que existe um treino e refeições planejadas para hoje. Idempotente. */
export async function ensureTodayPlan(userId: string, goal: Goal | null) {
  const supabase = await createClient();
  const date = todayISO();

  const { data: existingWorkout, error: existingWorkoutError } = await supabase
    .from("workouts")
    .select("id")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (existingWorkoutError) {
    console.error("[ensureTodayPlan] failed to read today's workout:", existingWorkoutError);
  }

  if (!existingWorkout) {
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
  }

  const { data: existingMeals, error: existingMealsError } = await supabase
    .from("meals")
    .select("id")
    .eq("user_id", userId)
    .eq("date", date)
    .limit(1);

  if (existingMealsError) {
    console.error("[ensureTodayPlan] failed to read today's meals:", existingMealsError);
  }

  if (!existingMeals || existingMeals.length === 0) {
    const { error: mealsError } = await supabase.from("meals").insert(
      STARTER_MEALS.map((name, i) => ({ user_id: userId, date, name, position: i }))
    );
    if (mealsError) {
      console.error("[ensureTodayPlan] failed to insert meals:", mealsError);
    }
  }
}

/** Aplica o objetivo escolhido no onboarding assim que a conta é confirmada. */
export async function completeOnboarding(userId: string, goal: Goal) {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ goal }).eq("id", userId);
  if (error) {
    console.error("[completeOnboarding] failed to save goal:", error);
  }
  await ensureTodayPlan(userId, goal);
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

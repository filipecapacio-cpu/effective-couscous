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

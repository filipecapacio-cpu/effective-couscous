export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import SetupNotice from "@/components/SetupNotice";
import PlanoClient from "@/components/PlanoClient";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/data";
import { ensureTodayPlan } from "@/app/actions/plan";
import type { Goal } from "@/lib/plan";

export default async function PlanoPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: profile } = await supabase.from("profiles").select("goal").eq("id", user.id).single();
  await ensureTodayPlan(user.id, (profile?.goal as Goal | null) ?? null);

  const date = todayISO();

  const { data: workout } = await supabase
    .from("workouts")
    .select("id, title, duration_min")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();

  const { data: exercises } = workout
    ? await supabase
        .from("workout_exercises")
        .select("id, name, detail, done")
        .eq("workout_id", workout.id)
        .order("position")
    : { data: [] };

  const { data: meals } = await supabase
    .from("meals")
    .select("id, name, detail, kcal, done")
    .eq("user_id", user.id)
    .eq("date", date)
    .order("position");

  return (
    <div className="mx-auto w-full max-w-[420px] min-h-svh flex flex-col">
      <PlanoClient
        workoutTitle={workout?.title ?? "Sem treino hoje"}
        durationMin={workout?.duration_min ?? null}
        exercises={exercises ?? []}
        meals={meals ?? []}
      />
      <BottomNav />
    </div>
  );
}

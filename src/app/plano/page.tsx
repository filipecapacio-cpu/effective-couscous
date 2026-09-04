export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import SetupNotice from "@/components/SetupNotice";
import PlanoClient from "@/components/PlanoClient";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/data";
import { ensureTodayPlan } from "@/app/actions/plan";
import { hasPlanFeature, type ProfilePlanTier } from "@/lib/plans";
import type { Goal } from "@/lib/plan";

export default async function PlanoPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: profile } = await supabase
    .from("profiles")
    .select("goal, plan_tier, is_founder")
    .eq("id", user.id)
    .single();
  await ensureTodayPlan(user.id, (profile?.goal as Goal | null) ?? null);
  const hasShareCardAccess = hasPlanFeature(
    profile as { plan_tier: ProfilePlanTier; is_founder: boolean } | null,
    "pro"
  );

  const date = todayISO();

  // Treino, refeições, registro do treino feito e o plano de IA salvo são independentes — busca tudo ao mesmo tempo.
  const [{ data: workout }, { data: meals }, { data: workoutLog }, { data: aiPlan }] = await Promise.all([
    supabase
      .from("workouts")
      .select("id, title, duration_min")
      .eq("user_id", user.id)
      .eq("date", date)
      .maybeSingle(),
    supabase
      .from("meals")
      .select("id, name, detail, kcal, done")
      .eq("user_id", user.id)
      .eq("date", date)
      .order("position"),
    supabase
      .from("workout_logs")
      .select("modality, intensity_label, intensity_score, duration_min")
      .eq("user_id", user.id)
      .eq("date", date)
      .maybeSingle(),
    supabase.from("ai_plans").select("plan, generated_at").eq("user_id", user.id).maybeSingle(),
  ]);

  const { data: exercises } = workout
    ? await supabase
        .from("workout_exercises")
        .select("id, name, detail, done")
        .eq("workout_id", workout.id)
        .order("position")
    : { data: [] };

  return (
    <div className="mx-auto w-full max-w-[420px] min-h-svh flex flex-col">
      <PlanoClient
        workoutId={workout?.id ?? null}
        userId={user.id}
        workoutTitle={workout?.title ?? "Sem treino hoje"}
        durationMin={workout?.duration_min ?? null}
        exercises={exercises ?? []}
        meals={meals ?? []}
        initialWorkoutLog={
          workoutLog
            ? {
                modality: workoutLog.modality,
                intensityLabel: workoutLog.intensity_label,
                intensityScore: workoutLog.intensity_score,
                durationMin: workoutLog.duration_min,
              }
            : null
        }
        aiPlanSummary={(aiPlan?.plan as { summary?: string } | null)?.summary ?? null}
        aiPlanGeneratedAt={aiPlan?.generated_at ?? null}
        hasShareCardAccess={hasShareCardAccess}
      />
      <BottomNav />
    </div>
  );
}

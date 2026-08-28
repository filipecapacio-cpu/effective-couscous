export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import SetupNotice from "@/components/SetupNotice";
import { CheckIcon, FlameIcon, LogOutIcon, PlayIcon, SparkleIcon } from "@/components/icons";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAnthropicConfigured } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";
import { getStreak, todayISO } from "@/lib/data";
import { completeOnboarding, ensureTodayPlan } from "@/app/actions/plan";
import { consumePendingGoal, signOut } from "@/app/actions/auth";
import type { Goal } from "@/lib/plan";

const WEEKDAY_LONG = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

export default async function DashboardPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  // Perfil e o cookie de onboarding pendente não dependem um do outro.
  const [{ data: profile }, pendingGoal] = await Promise.all([
    supabase.from("profiles").select("name, goal").eq("id", user.id).single(),
    consumePendingGoal(),
  ]);

  const goal = (profile?.goal as Goal | null) ?? null;
  if (pendingGoal && !goal) {
    await completeOnboarding(user.id, pendingGoal);
  } else {
    await ensureTodayPlan(user.id, goal);
  }

  const date = todayISO();

  const showAiCta = isAnthropicConfigured();

  // Treino, refeições, sequência e anamnese também são independentes entre si.
  const [{ data: workout }, { data: meals }, streak, hasAnamnesis] = await Promise.all([
    supabase
      .from("workouts")
      .select("id, title, duration_min")
      .eq("user_id", user.id)
      .eq("date", date)
      .maybeSingle(),
    supabase
      .from("meals")
      .select("id, name, kcal, done")
      .eq("user_id", user.id)
      .eq("date", date)
      .order("position"),
    getStreak(supabase, user.id),
    showAiCta
      ? supabase
          .from("anamneses")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle()
          .then(({ data }) => Boolean(data))
      : Promise.resolve(true),
  ]);

  const { data: exercises } = workout
    ? await supabase
        .from("workout_exercises")
        .select("id, done")
        .eq("workout_id", workout.id)
        .order("position")
    : { data: [] as { id: string; done: boolean }[] };

  const exList = exercises ?? [];
  const mealList = meals ?? [];
  const doneExercises = exList.filter((e) => e.done).length;
  const doneMeals = mealList.filter((m) => m.done).length;
  const totalSteps = exList.length + mealList.length;
  const doneSteps = doneExercises + doneMeals;
  const progressPct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  const firstName = (profile?.name || user.email || "").split(" ")[0].split("@")[0];
  const dateLabel = WEEKDAY_LONG.format(new Date());

  return (
    <div className="mx-auto w-full max-w-[420px] min-h-svh flex flex-col">
      <header className="px-6 pt-6 pb-1.5 flex items-center justify-between">
        <div>
          <div className="text-[13px] text-ink-soft">Bom dia{firstName ? `, ${firstName}` : ""}</div>
          <div className="font-serif italic text-2xl mt-0.5 capitalize">{dateLabel}</div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            aria-label="Sair"
            className="w-11 h-11 rounded-full bg-card flex items-center justify-center flex-shrink-0 text-ink-soft"
          >
            <LogOutIcon size={19} />
          </button>
        </form>
      </header>

      <main className="flex-1 px-6 pt-4.5 flex flex-col gap-4">
        {showAiCta && !hasAnamnesis && (
          <Link
            href="/anamnese"
            className="flex items-center gap-3 p-4 rounded-2xl bg-accent-soft"
          >
            <SparkleIcon size={20} className="text-accent flex-shrink-0" />
            <div className="flex-1">
              <div className="text-[14px] font-semibold">Gere seu plano com IA</div>
              <div className="text-[12.5px] text-ink-soft mt-0.5">
                Responda uma anamnese rápida e receba treino e dieta personalizados.
              </div>
            </div>
          </Link>
        )}

        {/* streak + progress */}
        <div className="flex gap-3">
          <div className="flex-1 bg-ink-bg rounded-[20px] p-4.5 flex flex-col justify-between h-[132px]">
            <div className="flex items-center justify-between">
              <span className="text-on-ink-soft text-xs">Sequência</span>
              <FlameIcon size={16} className="text-accent" />
            </div>
            <div className="font-serif italic text-on-ink text-4xl">
              {streak} <span className="font-sans not-italic text-[15px] text-on-ink-soft">dias</span>
            </div>
          </div>
          <div className="flex-1 bg-card rounded-[20px] p-4.5 flex flex-col justify-between h-[132px]">
            <span className="text-ink-soft text-xs">Progresso de hoje</span>
            <div className="font-serif italic text-4xl">{progressPct}%</div>
          </div>
        </div>

        {/* today's training */}
        <Link href="/plano" className="bg-ink rounded-[22px] p-5 text-paper flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-ink-soft uppercase tracking-[0.08em]">Treino de hoje</span>
            {workout?.duration_min && (
              <span className="text-xs text-on-ink-soft">{workout.duration_min} min</span>
            )}
          </div>
          <div className="font-serif italic text-2xl">{workout?.title ?? "Sem treino hoje"}</div>
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {exList.map((e) => (
                <div
                  key={e.id}
                  className={`w-2 h-2 rounded-full ${e.done ? "bg-accent" : "bg-white/25"}`}
                />
              ))}
            </div>
            <div className="w-9.5 h-9.5 rounded-full bg-accent flex items-center justify-center">
              <PlayIcon size={15} className="text-accent-ink" />
            </div>
          </div>
        </Link>

        {/* meals */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-semibold">Refeições</span>
            <span className="text-[13px] text-ink-soft">
              {doneMeals} de {mealList.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {mealList.map((meal) => (
              <div key={meal.id} className="flex items-center gap-3 bg-card rounded-2xl px-3.5 py-3">
                <div
                  className={`w-5.5 h-5.5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    meal.done ? "bg-accent" : "border-[1.5px] border-line"
                  }`}
                >
                  {meal.done && <CheckIcon size={12} className="text-accent-ink" />}
                </div>
                <span className="text-sm flex-1">{meal.name}</span>
                {meal.kcal && <span className="text-xs text-ink-faint">{meal.kcal} kcal</span>}
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

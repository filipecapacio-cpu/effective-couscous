export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import SetupNotice from "@/components/SetupNotice";
import ShareSummaryButton from "@/components/ShareSummaryButton";
import ProfileEditForm from "@/components/ProfileEditForm";
import SubscriptionManageModal from "@/components/SubscriptionManageModal";
import GarminConnectButton from "@/components/GarminConnectButton";
import Heatmap from "@/components/Heatmap";
import { ReadinessBars } from "@/components/ReadinessBars";
import { Logo } from "@/components/Logo";
import { SparkleIcon } from "@/components/icons";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAnthropicConfigured } from "@/lib/anthropic";
import { isTerraConfigured } from "@/lib/terra";
import { createClient } from "@/lib/supabase/server";
import { getMonthHeatmap, getWeekSummary } from "@/lib/data";
import { getGarminConnection, getReadinessSnapshot } from "@/lib/wearables";
import { PLAN_LABELS, hasPlanFeature, type ProfilePlanTier, type BillingCycle } from "@/lib/plans";

const RANGE_FMT = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long" });

export default async function PerfilPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const [{ data: profile }, summary, heatmap] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "name, weekly_goal, plan_tier, billing_cycle, is_founder, subscription_status, asaas_subscription_id"
      )
      .eq("id", user.id)
      .single(),
    getWeekSummary(supabase, user.id),
    getMonthHeatmap(supabase, user.id),
  ]);

  const rangeLabel = `${RANGE_FMT.format(new Date(summary.sinceISO))} – ${RANGE_FMT.format(new Date())}`;
  const initial = (profile?.name || user.email || "?").trim().charAt(0).toUpperCase();
  const hasHistory = summary.daysWithPlan > 0;
  const weeklyGoal = profile?.weekly_goal ?? 4;
  const hasHeatmapAccess = hasPlanFeature(
    profile as { plan_tier: ProfilePlanTier; is_founder: boolean } | null,
    "elite"
  );
  const planTier = (profile?.plan_tier ?? "free") as ProfilePlanTier;
  const canCancelSubscription =
    !profile?.is_founder &&
    !!profile?.asaas_subscription_id &&
    (profile?.subscription_status === "trialing" ||
      profile?.subscription_status === "active" ||
      profile?.subscription_status === "past_due");

  const hasWearableAccess = hasPlanFeature(
    profile as { plan_tier: ProfilePlanTier; is_founder: boolean } | null,
    "pro"
  );
  const showWearableSection = isTerraConfigured() && hasWearableAccess;
  const [garmin, readiness] = showWearableSection
    ? await Promise.all([getGarminConnection(supabase, user.id), getReadinessSnapshot(supabase, user.id)])
    : [null, null];

  const ringCircumference = 188.5;
  const ringOffset = ringCircumference * (1 - summary.consistency / 100);

  return (
    <div className="mx-auto w-full max-w-[420px] min-h-svh flex flex-col bg-ink-bg text-on-ink relative overflow-hidden">
      <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-accent opacity-20 blur-[2px] pointer-events-none" />

      <header className="px-5 pt-5 flex items-center justify-between relative">
        {profile?.is_founder ? (
          <div className="w-9" />
        ) : (
          <SubscriptionManageModal
            planTier={planTier}
            billingCycle={(profile?.billing_cycle as BillingCycle | null) ?? null}
            subscriptionStatus={profile?.subscription_status ?? "none"}
            canManage={canCancelSubscription}
            canCancel={canCancelSubscription}
          />
        )}
        <div className="text-[13px] font-mono text-on-ink-soft uppercase tracking-[0.08em]">
          Resumo da semana
        </div>
        <ProfileEditForm name={profile?.name || ""} weeklyGoal={weeklyGoal} />
      </header>

      <main className="flex-1 flex flex-col">
        <div className="mx-5 mt-5 bg-ink-bg-2 rounded-lg border border-white/10 p-6 relative flex-shrink-0">
          <div className="flex items-center gap-3 mb-5.5">
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-[15px] font-display font-bold text-accent-ink">
              {initial}
            </div>
            <div>
              <div className="text-sm font-semibold">{profile?.name || user.email}</div>
              <div className="text-xs text-on-ink-soft">{rangeLabel}</div>
            </div>
          </div>

          {hasHistory ? (
            <div className="font-display font-bold uppercase tracking-[-0.02em] text-[34px] leading-[1.15] mb-5.5">
              {summary.workoutsCompleted} de {summary.daysWithPlan} treinos concluídos essa semana.
            </div>
          ) : (
            <div className="font-display font-bold uppercase tracking-[-0.02em] text-[28px] leading-[1.25] mb-5.5 text-on-ink-soft">
              Sua semana começa agora. Volte depois do primeiro treino.
            </div>
          )}

          <div className="flex gap-2.5 mb-5.5">
            {[
              { value: `${summary.workoutsCompleted}/${summary.daysWithPlan}`, label: "treinos feitos" },
              { value: `${summary.consistency}%`, label: "consistência" },
            ].map((stat) => (
              <div key={stat.label} className="flex-1 bg-white/5 rounded-lg p-3.5">
                <div className="font-display font-bold tracking-[-0.02em] text-[28px] text-accent">{stat.value}</div>
                <div className="text-[11.5px] text-on-ink-soft mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={7} />
              <circle
                cx="36"
                cy="36"
                r="30"
                fill="none"
                stroke="var(--accent)"
                strokeWidth={7}
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                transform="rotate(-90 36 36)"
              />
            </svg>
            <div>
              <div className="text-xs text-on-ink-soft">Meta: {weeklyGoal}x por semana</div>
              <div className="text-lg font-semibold mt-0.5">{summary.consistency}% concluída</div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4.5 border-t border-white/10">
            <Logo size={16} className="text-[15px]" />
            <div className="text-[11px] text-on-ink-faint font-mono">onmode.app</div>
          </div>
        </div>

        <div className="px-5 pt-6">
          <div className="text-[13px] font-mono font-semibold text-on-ink-soft uppercase tracking-[0.06em] mb-3">
            Últimas 4 semanas
          </div>
          {hasHeatmapAccess ? (
            <Heatmap days={heatmap} />
          ) : (
            <Link
              href="/assinatura"
              className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10"
            >
              <SparkleIcon size={18} className="text-accent flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold">Histórico completo de consistência</div>
                <div className="text-[12.5px] text-on-ink-soft mt-0.5">
                  Veja o mês inteiro de um jeito só. Disponível no plano Elite.
                </div>
              </div>
              <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-on-ink-faint flex-shrink-0">
                {PLAN_LABELS.elite}
              </span>
            </Link>
          )}
        </div>

        {isAnthropicConfigured() && (
          <div className="px-5 pt-6">
            <Link
              href="/anamnese"
              className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10"
            >
              <SparkleIcon size={18} className="text-accent flex-shrink-0" />
              <div className="flex-1">
                <div className="text-[14px] font-semibold">Anamnese e plano com IA</div>
                <div className="text-[12.5px] text-on-ink-soft mt-0.5">
                  Editar suas respostas e gerar um novo plano personalizado
                </div>
              </div>
            </Link>
          </div>
        )}

        {isTerraConfigured() && (
          <div className="px-5 pt-6">
            <div className="text-[13px] font-mono font-semibold text-on-ink-soft uppercase tracking-[0.06em] mb-3">
              Wearable
            </div>
            {hasWearableAccess ? (
              <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-[14px] font-semibold">Garmin</div>
                  <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-on-ink-faint">
                    {garmin?.status === "connected" ? "Conectado" : "Desconectado"}
                  </span>
                </div>
                {readiness?.result && (
                  <div className="flex items-center gap-3">
                    <ReadinessBars score={readiness.result.score} size="sm" />
                    <div>
                      <div className="text-lg font-semibold">{readiness.result.score} de prontidão</div>
                      <div className="text-[12px] text-on-ink-soft">
                        {readiness.result.source === "combined"
                          ? "Garmin + registro de treino"
                          : readiness.result.source === "wearable"
                            ? "Dados do Garmin"
                            : "Registro de treino"}
                      </div>
                    </div>
                  </div>
                )}
                <GarminConnectButton connected={garmin?.status === "connected"} />
              </div>
            ) : (
              <Link
                href="/assinatura"
                className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10"
              >
                <SparkleIcon size={18} className="text-accent flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold">Conectar Garmin</div>
                  <div className="text-[12.5px] text-on-ink-soft mt-0.5">
                    Sono, FC de repouso, body battery e estresse direto no seu dashboard.
                  </div>
                </div>
                <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-on-ink-faint flex-shrink-0">
                  {PLAN_LABELS.pro}
                </span>
              </Link>
            )}
          </div>
        )}

        <div className="flex-1" />

        <div className="px-5 pb-7 pt-6">
          <ShareSummaryButton
            disabled={!hasHistory}
            text={`${summary.workoutsCompleted}/${summary.daysWithPlan} treinos concluídos e ${summary.consistency}% de consistência essa semana no Onmode.`}
          />
        </div>
      </main>

      <BottomNav dark />
    </div>
  );
}

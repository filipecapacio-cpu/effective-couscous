import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import { startPlan, stayOnFree, refreshSubscriptionStatus } from "@/app/actions/subscription";
import { PLAN_FEATURES, PLAN_LABELS, TRIAL_DAYS, formatBRL, planPrice } from "@/lib/plans";

export default async function AssinaturaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar?proximo=/assinatura");

  const { data: profile } = await supabase
    .from("profiles")
    .select("has_chosen_plan, plan_tier, subscription_status, trial_ends_at, checkout_url")
    .eq("id", user.id)
    .single();

  const trialActive =
    profile?.subscription_status === "trialing" &&
    !!profile.trial_ends_at &&
    new Date(profile.trial_ends_at) > new Date();

  const hasAccess =
    profile?.has_chosen_plan &&
    (profile.subscription_status === "active" || trialActive || profile.subscription_status === "none");

  if (hasAccess) redirect("/dashboard");

  // Trial vencido ou pagamento em atraso: já existe assinatura, só falta pagar.
  const pendingPayment =
    profile?.has_chosen_plan && profile.checkout_url && profile.subscription_status !== "none";

  return (
    <div className="mx-auto w-full max-w-md px-6 py-16 flex flex-col gap-8 min-h-svh">
      <Link href="/">
        <Logo className="text-2xl" />
      </Link>

      {pendingPayment ? (
        <>
          <div className="flex flex-col gap-2">
            <h1 className="font-display font-bold uppercase tracking-[-0.02em] text-3xl">
              Finalize seu pagamento
            </h1>
            <p className="text-ink-soft text-[15px]">
              {profile?.subscription_status === "past_due"
                ? "Seu último pagamento não foi confirmado. Regularize pra manter o acesso."
                : `Seu trial de ${TRIAL_DAYS} dias do plano ${PLAN_LABELS[profile!.plan_tier as "pro" | "elite"]} terminou. Confirme o pagamento pra continuar.`}
            </p>
          </div>

          <a
            href={profile!.checkout_url!}
            className="h-13 px-7 inline-flex items-center justify-center rounded bg-ink text-paper font-semibold text-[15px] hover:bg-accent transition-colors"
          >
            Ir para o pagamento
          </a>

          <form action={refreshSubscriptionStatus}>
            <button
              type="submit"
              className="w-full h-11 px-5 inline-flex items-center justify-center rounded border border-line font-semibold text-[15px] hover:border-ink transition-colors"
            >
              Já paguei — verificar novamente
            </button>
          </form>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <h1 className="font-display font-bold uppercase tracking-[-0.02em] text-3xl">
              Escolha seu plano
            </h1>
            <p className="text-ink-soft text-[15px]">
              {TRIAL_DAYS} dias grátis em qualquer plano. Cancele quando quiser antes do fim do trial.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {(["pro", "elite"] as const).map((tier) => (
              <div key={tier} className="border border-line rounded-lg p-5 flex flex-col gap-4">
                <div>
                  <h2 className="font-display font-bold uppercase tracking-[-0.02em] text-xl">
                    {PLAN_LABELS[tier]}
                  </h2>
                  <p className="text-ink-soft text-sm mt-1">
                    {formatBRL(planPrice(tier, "annual"))}/ano · ou {formatBRL(planPrice(tier, "monthly"))}/mês
                  </p>
                </div>

                <ul className="text-sm text-ink-soft flex flex-col gap-1.5">
                  {PLAN_FEATURES[tier].map((feature) => (
                    <li key={feature}>· {feature}</li>
                  ))}
                </ul>

                <form action={startPlan} className="flex flex-col gap-2">
                  <input type="hidden" name="tier" value={tier} />
                  <input type="hidden" name="cycle" value="annual" />
                  <button
                    type="submit"
                    className="h-12 px-5 inline-flex items-center justify-center rounded bg-ink text-paper font-semibold text-[15px] hover:bg-accent transition-colors"
                  >
                    Começar trial — plano anual
                  </button>
                </form>
                <form action={startPlan}>
                  <input type="hidden" name="tier" value={tier} />
                  <input type="hidden" name="cycle" value="monthly" />
                  <button type="submit" className="text-sm text-ink-soft underline underline-offset-2">
                    Prefiro o mensal ({formatBRL(planPrice(tier, "monthly"))}/mês)
                  </button>
                </form>
              </div>
            ))}
          </div>

          <form action={stayOnFree}>
            <button type="submit" className="w-full text-sm text-ink-soft underline underline-offset-2">
              Continuar no Free (sem Garmin, histórico de 7 dias)
            </button>
          </form>
        </>
      )}
    </div>
  );
}

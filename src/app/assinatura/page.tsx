export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { refreshSubscriptionStatus } from "@/app/actions/subscription";
import PlanPicker from "@/components/PlanPicker";
import { PLAN_LABELS, TRIAL_DAYS } from "@/lib/plans";

export default async function AssinaturaPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar?proximo=/assinatura");

  const { data: profile } = await supabase
    .from("profiles")
    .select("has_chosen_plan, plan_tier, subscription_status, trial_ends_at, checkout_url, is_founder")
    .eq("id", user.id)
    .single();

  const trialActive =
    profile?.subscription_status === "trialing" &&
    !!profile.trial_ends_at &&
    new Date(profile.trial_ends_at) > new Date();

  // Só manda de volta pro dashboard quem já tem acesso pago (ou é founder) -
  // "none" (Free) não conta aqui de propósito: um usuário Free precisa
  // conseguir voltar nessa tela pra fazer upgrade. O paywall de "ainda não
  // escolheu nada" continua sendo aplicado pelo middleware, não por aqui.
  const hasPaidAccess =
    profile?.is_founder ||
    (profile?.has_chosen_plan && (profile.subscription_status === "active" || trialActive));

  if (hasPaidAccess) redirect("/dashboard");

  // Trial vencido ou pagamento em atraso: já existe assinatura, só falta
  // pagar. "canceled" fica de fora de propósito - quem cancelou vê o
  // seletor de planos de novo (pra reassinar ou voltar pro Free), não uma
  // cobrança antiga que já não existe mais no Asaas.
  const pendingPayment =
    profile?.has_chosen_plan &&
    profile.checkout_url &&
    (profile.subscription_status === "trialing" || profile.subscription_status === "past_due");

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
        <PlanPicker />
      )}
    </div>
  );
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAsaasCustomer, createAsaasSubscription } from "@/lib/asaas";
import { TRIAL_DAYS, type PlanTier, type BillingCycle } from "@/lib/plans";

/**
 * Inicia o trial de 7 dias no plano escolhido: cria cliente + assinatura
 * no Asaas (1ª cobrança só vence depois do trial) e libera o acesso do
 * usuário imediatamente com subscription_status = "trialing".
 */
export async function startPlan(formData: FormData) {
  const tier = String(formData.get("tier")) as PlanTier;
  const cycle = String(formData.get("cycle")) as BillingCycle;

  if (tier !== "pro" && tier !== "elite") throw new Error("Plano inválido.");
  if (cycle !== "monthly" && cycle !== "annual") throw new Error("Ciclo inválido.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?proximo=/assinatura");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  const customer = await createAsaasCustomer({
    name: profile?.name || user.email || "Usuário Onmode",
    email: user.email ?? "",
    externalReference: user.id,
  });
  const { subscription, invoiceUrl } = await createAsaasSubscription({
    customerId: customer.id,
    tier,
    cycle,
    externalReference: user.id,
  });

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      plan_tier: tier,
      billing_cycle: cycle,
      subscription_status: "trialing",
      trial_ends_at: trialEndsAt.toISOString(),
      asaas_customer_id: customer.id,
      asaas_subscription_id: subscription.id,
      checkout_url: invoiceUrl,
      has_chosen_plan: true,
      subscription_updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  redirect("/dashboard");
}

/** Fica no Free — sem trial, sem cobrança, acesso liberado na hora. */
export async function stayOnFree() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?proximo=/assinatura");

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      plan_tier: "free",
      subscription_status: "none",
      has_chosen_plan: true,
      subscription_updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  redirect("/dashboard");
}

/** Recarrega a página de assinatura pra checar se o webhook já confirmou o pagamento. */
export async function refreshSubscriptionStatus() {
  revalidatePath("/assinatura");
}

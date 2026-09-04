"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createAsaasCustomer,
  createAsaasSubscription,
  cancelAsaasSubscription,
  updateAsaasPaymentValue,
} from "@/lib/asaas";
import { TRIAL_DAYS, applyDiscount, planPrice, type PlanTier, type BillingCycle } from "@/lib/plans";

/**
 * Inicia o trial de 7 dias no plano escolhido: cria cliente + assinatura
 * no Asaas (1ª cobrança só vence depois do trial) e libera o acesso do
 * usuário imediatamente com subscription_status = "trialing".
 */
export type StartPlanResult = { error: string } | null;

export async function startPlan(formData: FormData): Promise<StartPlanResult> {
  const tier = String(formData.get("tier")) as PlanTier;
  const cycle = String(formData.get("cycle")) as BillingCycle;
  const couponCode = String(formData.get("coupon") ?? "").trim().toUpperCase();

  if (tier !== "pro" && tier !== "elite") return { error: "Plano inválido." };
  if (cycle !== "monthly" && cycle !== "annual") return { error: "Ciclo inválido." };

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

  const admin = createAdminClient();

  // Cupom de parceiro/influencer: dá desconto só na primeira cobrança (não
  // mexe no valor recorrente da assinatura). Checa aqui com a service role
  // key porque não existe policy pública de leitura em coupons - código
  // errado ou inativo simplesmente não aplica desconto nenhum, sem travar
  // o checkout por causa de um cupom digitado errado.
  let coupon: { id: string; discount_percent: number } | null = null;
  if (couponCode) {
    const { data } = await admin
      .from("coupons")
      .select("id, discount_percent")
      .eq("code", couponCode)
      .eq("active", true)
      .maybeSingle();
    coupon = data;
  }

  let customer: Awaited<ReturnType<typeof createAsaasCustomer>>;
  let subscription: Awaited<ReturnType<typeof createAsaasSubscription>>["subscription"];
  let invoiceUrl: string;
  let firstPaymentId: string;
  try {
    customer = await createAsaasCustomer({
      name: profile?.name || user.email || "Usuário Onmode",
      email: user.email ?? "",
      externalReference: user.id,
    });
    ({ subscription, invoiceUrl, firstPaymentId } = await createAsaasSubscription({
      customerId: customer.id,
      tier,
      cycle,
      externalReference: user.id,
    }));
  } catch (err) {
    // O Asaas pode engasgar por um instante (rede, manutenção) - sem isso o
    // usuário via a tela de erro genérica do Next.js em vez de uma
    // mensagem decente, e ainda por cima nenhuma assinatura ficava
    // pendurada pela metade (não gravamos nada no profile antes daqui).
    console.error("[startPlan] failed to create Asaas subscription:", err);
    return { error: "Não deu pra iniciar sua assinatura agora. Tenta de novo em instantes." };
  }

  if (coupon) {
    try {
      const discountedValue = applyDiscount(planPrice(tier, cycle), coupon.discount_percent);
      await updateAsaasPaymentValue(firstPaymentId, discountedValue);
    } catch (err) {
      // A assinatura já foi criada com sucesso - não vale travar o usuário
      // por causa do desconto não aplicar. Ele só paga o valor cheio.
      console.error("[startPlan] failed to apply coupon discount to first payment:", err);
      coupon = null;
    }
  }

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

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
      coupon_id: coupon?.id ?? null,
      coupon_discount_percent: coupon?.discount_percent ?? null,
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

export type CancelSubscriptionResult = { error: string } | { ok: true };

/**
 * Cancela a assinatura paga do usuário: cancela no Asaas (não gera mais
 * cobranças) e já derruba o acesso pago na hora — mesmo comportamento que
 * o webhook aplica pra reembolso/estorno, então fica consistente com o
 * resto do sistema. Não existe "acesso até o fim do período pago"; o
 * texto de confirmação na tela deixa isso claro antes do usuário confirmar.
 */
export async function cancelSubscription(): Promise<CancelSubscriptionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("asaas_subscription_id, subscription_status")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("[cancelSubscription] failed to read profile:", profileError);
    return { error: "Não deu pra cancelar agora. Tenta de novo em instantes." };
  }

  if (profile.subscription_status === "canceled") {
    return { ok: true };
  }

  if (!profile.asaas_subscription_id) {
    return { error: "Você não tem uma assinatura paga pra cancelar." };
  }

  try {
    await cancelAsaasSubscription(profile.asaas_subscription_id);
  } catch (err) {
    console.error("[cancelSubscription] Asaas cancel failed:", err);
    return { error: "Não deu pra cancelar agora. Tenta de novo em instantes ou fala com o suporte." };
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ subscription_status: "canceled", subscription_updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) {
    console.error("[cancelSubscription] failed to update profile after Asaas cancel:", updateError);
    return { error: "Cancelamos no Asaas, mas houve um erro ao atualizar seu acesso. Fala com o suporte." };
  }

  revalidatePath("/perfil");
  revalidatePath("/assinatura");
  revalidatePath("/dashboard");
  return { ok: true };
}

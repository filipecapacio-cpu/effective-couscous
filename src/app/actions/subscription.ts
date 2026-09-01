"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAsaasCustomer, createAsaasPayment } from "@/lib/asaas";

/** Gera (ou refaz) o link de checkout do Asaas pro usuário logado. */
export async function retryCheckout() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");

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
  const payment = await createAsaasPayment({
    customerId: customer.id,
    externalReference: user.id,
  });

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      asaas_customer_id: customer.id,
      asaas_payment_id: payment.id,
      checkout_url: payment.invoiceUrl,
    })
    .eq("id", user.id);

  redirect(payment.invoiceUrl);
}

/** Recarrega a página de assinatura pra checar se o webhook já confirmou o pagamento. */
export async function refreshSubscriptionStatus() {
  revalidatePath("/assinatura");
}

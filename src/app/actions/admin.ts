"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireFounder(): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const { data: profile } = await supabase.from("profiles").select("is_founder").eq("id", user.id).single();
  if (!profile?.is_founder) return { error: "Sem permissão." };
  return null;
}

export type CreateInfluencerResult =
  | { error: string }
  | { ok: true; email: string; tempPassword: string; code: string };

/**
 * Cria a conta de login do parceiro/influencer (via Admin API do Supabase -
 * evita mexer direto em auth.users com SQL) + o cupom dele. Só founders
 * chamam isso (checado aqui, não só escondido na tela). A senha temporária
 * volta na resposta pra ser repassada ao influencer por fora do app (WhatsApp,
 * e-mail); ele pode trocar depois em "Esqueci minha senha".
 */
export async function createInfluencerCoupon(formData: FormData): Promise<CreateInfluencerResult> {
  const guard = await requireFounder();
  if (guard) return guard;

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const discountPercent = Number(formData.get("discount_percent"));
  const commissionPercent = Number(formData.get("commission_percent"));

  if (!name || !email || !code) {
    return { error: "Preencha nome, e-mail e código do cupom." };
  }
  if (!(discountPercent > 0 && discountPercent <= 100)) {
    return { error: "Desconto precisa ser entre 1 e 100." };
  }
  if (!(commissionPercent > 0 && commissionPercent <= 100)) {
    return { error: "Comissão precisa ser entre 1 e 100." };
  }

  const admin = createAdminClient();
  const tempPassword = randomUUID().slice(0, 12);

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name },
  });
  if (createError || !created.user) {
    return { error: `Não deu pra criar a conta: ${createError?.message ?? "erro desconhecido"}` };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ name, is_influencer: true })
    .eq("id", created.user.id);
  if (profileError) {
    console.error("[createInfluencerCoupon] failed to update profile:", profileError);
  }

  const { error: couponError } = await admin.from("coupons").insert({
    code,
    influencer_id: created.user.id,
    discount_percent: discountPercent,
    commission_percent: commissionPercent,
  });
  if (couponError) {
    return {
      error: `A conta foi criada (${email}) mas o cupom não salvou: ${couponError.message}. Pode tentar de novo só o cupom, a conta já existe.`,
    };
  }

  revalidatePath("/admin/parceiros");
  return { ok: true, email, tempPassword, code };
}

/** Ativa/desativa um cupom (ex: parou a parceria, ou fez um código promocional temporário). */
export async function toggleCoupon(couponId: string, active: boolean) {
  const guard = await requireFounder();
  if (guard) return guard;

  const admin = createAdminClient();
  const { error } = await admin.from("coupons").update({ active }).eq("id", couponId);
  if (error) {
    console.error("[toggleCoupon] failed:", error);
    return { error: "Não deu pra atualizar o cupom." };
  }

  revalidatePath("/admin/parceiros");
  return { ok: true as const };
}

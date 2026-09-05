"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createWidgetSession, deauthenticateUser, isTerraConfigured } from "@/lib/terra";

/** Origem (protocolo + domínio) do pedido atual, pras redirect URLs do widget. */
async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export type ConnectGarminResult = { error: string } | null;

/**
 * Gera a URL do Connection Widget da Terra e redireciona o usuário pra lá.
 * `reference_id` = auth.uid() do usuário logado — é essa referência que o
 * webhook `type: "auth"` devolve junto com o user_id da Terra, permitindo
 * linkar os dois lados (ver src/app/api/webhooks/terra/route.ts). A ligação
 * em si só é gravada quando esse webhook chega, não aqui.
 */
export async function connectGarmin(): Promise<ConnectGarminResult> {
  if (!isTerraConfigured()) {
    return { error: "Integração com wearables não está configurada nesta instalação." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const origin = await siteOrigin();

  let widgetUrl: string;
  try {
    const session = await createWidgetSession({
      referenceId: user.id,
      successRedirectUrl: `${origin}/perfil?garmin=conectado`,
      failureRedirectUrl: `${origin}/perfil?garmin=erro`,
    });
    widgetUrl = session.url;
  } catch (err) {
    console.error("[connectGarmin] failed to create widget session:", err);
    return { error: "Não deu pra iniciar a conexão com o Garmin agora. Tenta de novo em instantes." };
  }

  redirect(widgetUrl);
}

export type DisconnectGarminResult = { error: string } | { ok: true };

/**
 * Desconecta o Garmin: revoga o acesso na Terra e já marca localmente como
 * desconectado (não espera o webhook `deauth` confirmar - assim a tela
 * responde na hora; se o webhook chegar depois, é um update idempotente).
 */
export async function disconnectGarmin(): Promise<DisconnectGarminResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("garmin_terra_user_id")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("[disconnectGarmin] failed to read profile:", profileError);
    return { error: "Não deu pra desconectar agora. Tenta de novo em instantes." };
  }

  if (profile.garmin_terra_user_id) {
    try {
      await deauthenticateUser(profile.garmin_terra_user_id);
    } catch (err) {
      // Mesmo se a Terra falhar em revogar do lado dela, ainda vale marcar
      // como desconectado localmente - o webhook "deauth" cobre o caso do
      // usuário desconectar direto pela Garmin/Terra em vez de pelo Onmode.
      console.error("[disconnectGarmin] Terra deauth failed:", err);
    }
  }

  const { error } = await admin
    .from("profiles")
    .update({ garmin_status: "disconnected", garmin_disconnected_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    console.error("[disconnectGarmin] failed to update profile:", error);
    return { error: "Desconectamos na Terra, mas houve um erro ao atualizar seu status. Tenta de novo." };
  }

  revalidatePath("/perfil");
  return { ok: true };
}

/** Recarrega a página de perfil pra checar se a conexão já foi confirmada pelo webhook. */
export async function refreshGarminStatus() {
  revalidatePath("/perfil");
}

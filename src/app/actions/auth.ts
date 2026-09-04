"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Goal } from "@/lib/plan";

const PENDING_GOAL_COOKIE = "pulso_pending_goal";

export type AuthResult = { error: string } | { needsEmailConfirmation: true } | null;
export type PasswordResetRequestResult = { error: string } | { sent: true } | null;

export async function signUp(formData: FormData): Promise<AuthResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const acceptedTerms = formData.get("terms") === "on";
  const goal = formData.get("goal") ? String(formData.get("goal")) : null;

  if (!name || !email || !password) {
    return { error: "Preencha nome, e-mail e senha." };
  }
  if (!acceptedTerms) {
    return { error: "Você precisa aceitar os Termos de Uso e a Política de Privacidade pra criar sua conta." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) {
    return { error: traduzErro(error.message) };
  }

  if (data.user) {
    // Client admin porque, quando a confirmação de e-mail está ativa, ainda
    // não existe sessão nesse momento - a policy "profiles: update own"
    // (auth.uid() = id) bloquearia a escrita do client normal.
    const admin = createAdminClient();
    const { error: consentError } = await admin
      .from("profiles")
      .update({ terms_accepted_at: new Date().toISOString() })
      .eq("id", data.user.id);
    if (consentError) {
      console.error("[signUp] failed to record terms acceptance:", consentError);
    }
  }

  if (goal) {
    const cookieStore = await cookies();
    cookieStore.set(PENDING_GOAL_COOKIE, goal, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
  }

  if (!data.session) {
    return { needsEmailConfirmation: true };
  }

  redirect("/assinatura");
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Preencha e-mail e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: traduzErro(error.message) };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/** Origem (protocolo + domínio) do pedido atual, pra montar o link do e-mail. */
async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Envia o e-mail de "esqueci minha senha", com o link de volta pro app. */
export async function requestPasswordReset(formData: FormData): Promise<PasswordResetRequestResult> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Preencha o e-mail." };
  }

  const supabase = await createClient();
  const origin = await siteOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/redefinir-senha`,
  });

  if (error) {
    return { error: traduzErro(error.message) };
  }

  return { sent: true };
}

/** Define a nova senha - só funciona com a sessão de recuperação vinda do link do e-mail. */
export async function updatePassword(formData: FormData): Promise<AuthResult> {
  const password = String(formData.get("password") ?? "");
  if (!password || password.length < 6) {
    return { error: "A senha precisa ter pelo menos 6 caracteres." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: traduzErro(error.message) };
  }

  redirect("/dashboard");
}

/** Lê (e some com) o objetivo escolhido no onboarding antes do cadastro. */
export async function consumePendingGoal(): Promise<Goal | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(PENDING_GOAL_COOKIE)?.value ?? null;
  if (value) {
    try {
      cookieStore.delete(PENDING_GOAL_COOKIE);
    } catch {
      // Chamado a partir da renderização de um Server Component, que não
      // pode escrever cookies — sem problema, o cookie expira sozinho e
      // completeOnboarding() é idempotente se essa leitura se repetir.
    }
  }
  return value as Goal | null;
}

function traduzErro(message: string): string {
  if (message.includes("already registered")) return "Esse e-mail já tem conta. Tente entrar.";
  if (message.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (message.includes("Password should be")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (message.includes("For security purposes")) return "Espera um minutinho antes de tentar de novo.";
  if (message.includes("Auth session missing")) return "Esse link de redefinição expirou ou já foi usado. Peça um novo.";
  return message;
}

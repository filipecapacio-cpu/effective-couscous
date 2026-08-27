"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Goal } from "@/lib/plan";

const PENDING_GOAL_COOKIE = "pulso_pending_goal";

export type AuthResult = { error: string } | { needsEmailConfirmation: true } | null;

export async function signUp(formData: FormData): Promise<AuthResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const goal = formData.get("goal") ? String(formData.get("goal")) : null;

  if (!name || !email || !password) {
    return { error: "Preencha nome, e-mail e senha." };
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

  redirect("/dashboard");
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

/** Lê (e some com) o objetivo escolhido no onboarding antes do cadastro. */
export async function consumePendingGoal(): Promise<Goal | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(PENDING_GOAL_COOKIE)?.value ?? null;
  if (value) cookieStore.delete(PENDING_GOAL_COOKIE);
  return value as Goal | null;
}

function traduzErro(message: string): string {
  if (message.includes("already registered")) return "Esse e-mail já tem conta. Tente entrar.";
  if (message.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (message.includes("Password should be")) return "A senha precisa ter pelo menos 6 caracteres.";
  return message;
}

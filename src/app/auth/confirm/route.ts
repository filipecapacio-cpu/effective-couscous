import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback compartilhado por todo link de e-mail que troca um código por
 * sessão: confirmação de cadastro (signUp -> next=/assinatura) e "esqueci
 * minha senha" (requestPasswordReset -> next=/redefinir-senha). O destino
 * vem sempre explícito no link gerado por quem disparou o e-mail; o default
 * de /redefinir-senha só entra se algum link antigo/externo não mandar
 * `next`.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/redefinir-senha";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/esqueci-senha?erro=link-invalido`);
}

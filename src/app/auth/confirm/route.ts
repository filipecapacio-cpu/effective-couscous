import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Pra onde o link do e-mail de "esqueci minha senha" aponta. Troca o código
 * que vem na URL por uma sessão de verdade (fica nos cookies) e manda pra
 * tela de definir a nova senha.
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

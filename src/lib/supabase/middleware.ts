import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

const PROTECTED_PATHS = ["/dashboard", "/plano", "/perfil", "/anamnese", "/assistente", "/agenda"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    // Sem Supabase configurado ainda: deixa passar (as próprias páginas
    // mostram o aviso de configuração em vez de quebrar a navegação).
    return response;
  }

  const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("proximo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (isProtected && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("has_chosen_plan, subscription_status, trial_ends_at")
      .eq("id", user.id)
      .single();

    const trialActive =
      profile?.subscription_status === "trialing" &&
      !!profile.trial_ends_at &&
      new Date(profile.trial_ends_at) > new Date();

    const hasAccess =
      profile?.has_chosen_plan &&
      (profile.subscription_status === "active" || trialActive || profile.subscription_status === "none");
    // "none" só conta como acesso liberado quando o usuário já escolheu
    // ativamente ficar no Free (has_chosen_plan = true); "past_due" e
    // "canceled" caem no hard paywall.

    if (!hasAccess) {
      const url = request.nextUrl.clone();
      url.pathname = "/assinatura";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

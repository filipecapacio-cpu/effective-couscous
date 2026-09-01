import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";
import { retryCheckout, refreshSubscriptionStatus } from "@/app/actions/subscription";

export default async function AssinaturaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar?proximo=/assinatura");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, checkout_url")
    .eq("id", user.id)
    .single();

  if (profile?.subscription_status === "active") {
    redirect("/dashboard");
  }

  const isCanceled = profile?.subscription_status === "canceled";

  return (
    <div className="mx-auto w-full max-w-md px-6 py-16 flex flex-col gap-8 min-h-svh">
      <Link href="/">
        <Logo className="text-2xl" />
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="font-display font-bold uppercase tracking-[-0.02em] text-3xl">
          {isCanceled ? "Assinatura pendente" : "Finalize seu pagamento"}
        </h1>
        <p className="text-ink-soft text-[15px]">
          {isCanceled
            ? "Seu último pagamento não foi confirmado. Gere um novo link pra continuar."
            : "Sua conta já foi criada. Falta só confirmar o pagamento pra liberar o acesso ao Onmode."}
        </p>
      </div>

      {profile?.checkout_url && !isCanceled ? (
        <a
          href={profile.checkout_url}
          className="h-13 px-7 inline-flex items-center justify-center rounded bg-ink text-paper font-semibold text-[15px] hover:bg-accent transition-colors"
        >
          Ir para o pagamento
        </a>
      ) : (
        <form action={retryCheckout}>
          <button
            type="submit"
            className="w-full h-13 px-7 inline-flex items-center justify-center rounded bg-ink text-paper font-semibold text-[15px] hover:bg-accent transition-colors"
          >
            Gerar link de pagamento
          </button>
        </form>
      )}

      <form action={refreshSubscriptionStatus}>
        <button
          type="submit"
          className="w-full h-11 px-5 inline-flex items-center justify-center rounded border border-line font-semibold text-[15px] hover:border-ink transition-colors"
        >
          Já paguei — verificar novamente
        </button>
      </form>

      <p className="text-sm text-ink-soft">
        Pagamento via Pix, boleto ou cartão. A confirmação costuma cair em
        segundos, mas boleto pode levar até 1 dia útil.
      </p>
    </div>
  );
}

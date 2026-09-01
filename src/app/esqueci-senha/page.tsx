export const dynamic = "force-dynamic";

import Link from "next/link";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import SetupNotice from "@/components/SetupNotice";
import { Logo } from "@/components/Logo";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function EsqueciSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const { erro } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-md px-6 py-16 flex flex-col gap-8 min-h-svh">
      <Link href="/">
        <Logo className="text-2xl" />
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="font-display font-bold uppercase tracking-[-0.02em] text-3xl">Esqueceu a senha?</h1>
        <p className="text-ink-soft text-[15px]">
          Digita seu e-mail que a gente manda um link pra você criar uma nova.
        </p>
      </div>

      {erro === "link-invalido" && (
        <div className="rounded-lg bg-card p-4 text-sm text-ink-soft">
          Esse link de redefinição expirou ou já foi usado. Pede um novo abaixo.
        </div>
      )}

      <ForgotPasswordForm />

      <p className="text-sm text-ink-soft">
        Lembrou a senha?{" "}
        <Link href="/entrar" className="font-semibold text-ink">
          Entrar
        </Link>
      </p>
    </div>
  );
}

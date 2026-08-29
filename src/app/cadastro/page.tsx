import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import SetupNotice from "@/components/SetupNotice";
import { Logo } from "@/components/Logo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signUp } from "@/app/actions/auth";

export default async function CadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ goal?: string }>;
}) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const { goal } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-md px-6 py-16 flex flex-col gap-8 min-h-svh">
      <Link href="/">
        <Logo className="text-2xl" />
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="font-bold uppercase tracking-[-0.02em] text-3xl">Criar minha conta</h1>
        <p className="text-ink-soft text-[15px]">
          Seu ritmo começa aqui — treino, refeições e progresso salvos de
          verdade.
        </p>
      </div>

      <AuthForm action={signUp} mode="cadastro" goal={goal ?? null} />

      <p className="text-sm text-ink-soft">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-semibold text-ink">
          Entrar
        </Link>
      </p>
    </div>
  );
}

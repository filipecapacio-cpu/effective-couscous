import Link from "next/link";
import AuthForm from "@/components/AuthForm";
import SetupNotice from "@/components/SetupNotice";
import { Logo } from "@/components/Logo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signIn } from "@/app/actions/auth";

export default async function EntrarPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  return (
    <div className="mx-auto w-full max-w-md px-6 py-16 flex flex-col gap-8 min-h-svh">
      <Link href="/">
        <Logo className="text-2xl" />
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="font-display font-bold uppercase tracking-[-0.02em] text-3xl">De volta ao seu ritmo</h1>
        <p className="text-ink-soft text-[15px]">Entre pra ver o seu ritmo de hoje.</p>
      </div>

      <AuthForm action={signIn} mode="entrar" />

      <Link href="/esqueci-senha" className="text-sm font-semibold text-ink -mt-2">
        Esqueceu a senha?
      </Link>

      <p className="text-sm text-ink-soft">
        Ainda não tem conta?{" "}
        <Link href="/onboarding" className="font-semibold text-ink">
          Comece agora
        </Link>
      </p>
    </div>
  );
}

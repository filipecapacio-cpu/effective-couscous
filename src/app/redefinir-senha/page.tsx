export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import UpdatePasswordForm from "@/components/UpdatePasswordForm";
import SetupNotice from "@/components/SetupNotice";
import { Logo } from "@/components/Logo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function RedefinirSenhaPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  // Só chega com sessão válida quem veio do link do e-mail (via /auth/confirm).
  // Sem isso, o link expirou, já foi usado, ou é acesso direto na URL.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/esqueci-senha?erro=link-invalido");

  return (
    <div className="mx-auto w-full max-w-md px-6 py-16 flex flex-col gap-8 min-h-svh">
      <Logo className="text-2xl" />

      <div className="flex flex-col gap-2">
        <h1 className="font-display font-bold uppercase tracking-[-0.02em] text-3xl">Nova senha</h1>
        <p className="text-ink-soft text-[15px]">Escolhe uma senha nova pra sua conta.</p>
      </div>

      <UpdatePasswordForm />
    </div>
  );
}

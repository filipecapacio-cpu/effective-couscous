export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import AnamneseForm from "@/components/AnamneseForm";
import SetupNotice from "@/components/SetupNotice";
import { Logo } from "@/components/Logo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Anamnesis } from "@/lib/anamnesis";

export default async function AnamnesePage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: anamnesis } = await supabase
    .from("anamneses")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-10 flex flex-col gap-8">
      <Link href="/dashboard">
        <Logo className="text-2xl" />
      </Link>

      <div className="flex flex-col gap-2">
        <div className="text-[13px] font-mono tracking-[0.1em] uppercase text-ink-soft font-semibold">
          Assistente de IA
        </div>
        <h1 className="font-display font-bold uppercase tracking-[-0.02em] text-3xl">Sua anamnese</h1>
        <p className="text-ink-soft text-[15px]">
          Quanto mais completo, mais preciso fica o treino e a dieta gerados pra você. Isso fica
          só entre você e o Onmode.
        </p>
      </div>

      <AnamneseForm initial={(anamnesis as Anamnesis | null) ?? null} />
    </div>
  );
}

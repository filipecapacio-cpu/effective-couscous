export const dynamic = "force-dynamic";
// Gerar o plano semanal com IA pode levar bem mais que o timeout padrão de
// função serverless — dá folga pro Vercel não matar a requisição no meio.
export const maxDuration = 60;

import Link from "next/link";
import { redirect } from "next/navigation";
import AnamneseForm from "@/components/AnamneseForm";
import SetupNotice from "@/components/SetupNotice";
import { Logo } from "@/components/Logo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Anamnesis } from "@/lib/anamnesis";
import { hasPlanFeature, type ProfilePlanTier } from "@/lib/plans";

export default async function AnamnesePage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const [{ data: profile }, { data: anamnesis }] = await Promise.all([
    supabase.from("profiles").select("plan_tier, is_founder").eq("id", user.id).single(),
    supabase.from("anamneses").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const hasAiAccess = hasPlanFeature(
    profile as { plan_tier: ProfilePlanTier; is_founder: boolean } | null,
    "pro"
  );

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

      {hasAiAccess ? (
        <AnamneseForm initial={(anamnesis as Anamnesis | null) ?? null} />
      ) : (
        <div className="rounded-lg bg-card p-5 text-[15px] leading-relaxed flex flex-col gap-4">
          O assistente de IA (anamnese + plano semanal gerado automaticamente) é uma funcionalidade
          dos planos Pro e Elite.
          <Link
            href="/assinatura"
            className="self-start h-11 px-5 inline-flex items-center justify-center rounded bg-ink text-paper font-semibold text-[15px] hover:bg-accent transition-colors"
          >
            Ver planos
          </Link>
        </div>
      )}
    </div>
  );
}

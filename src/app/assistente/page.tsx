export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import SetupNotice from "@/components/SetupNotice";
import ChatClient from "@/components/ChatClient";
import { PlanGate } from "@/components/PlanGate";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAnthropicConfigured } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";
import { tierAtLeast, type ProfilePlanTier } from "@/lib/plans";

export default async function AssistentePage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const [{ data: profile }, { data: history }, { data: anamnesis }] = await Promise.all([
    supabase.from("profiles").select("plan_tier").eq("id", user.id).single(),
    supabase
      .from("chat_messages")
      .select("id, role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(50),
    supabase.from("anamneses").select("user_id").eq("user_id", user.id).maybeSingle(),
  ]);

  const hasAiAccess = tierAtLeast(profile?.plan_tier as ProfilePlanTier | null, "pro");

  return (
    <div className="mx-auto w-full max-w-[420px] min-h-svh flex flex-col">
      <header className="px-6 pt-6 pb-3">
        <div className="text-[13px] text-ink-soft">Seu coach</div>
        <h1 className="font-display font-bold uppercase tracking-[-0.02em] text-[28px] mt-1">Assistente Onmode</h1>
      </header>

      {hasAiAccess ? (
        <ChatClient
          initialMessages={history ?? []}
          hasAnamnesis={Boolean(anamnesis)}
          aiConfigured={isAnthropicConfigured()}
        />
      ) : (
        <div className="px-6">
          <PlanGate
            minTier="pro"
            title="Converse com o assistente Onmode"
            body="Chat livre pra ajustar seu treino e sua dieta. Disponível nos planos Pro e Elite."
          />
        </div>
      )}

      <BottomNav />
    </div>
  );
}

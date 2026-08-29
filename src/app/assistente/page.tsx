export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import SetupNotice from "@/components/SetupNotice";
import ChatClient from "@/components/ChatClient";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isAnthropicConfigured } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";

export default async function AssistentePage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const [{ data: history }, { data: anamnesis }] = await Promise.all([
    supabase
      .from("chat_messages")
      .select("id, role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(50),
    supabase.from("anamneses").select("user_id").eq("user_id", user.id).maybeSingle(),
  ]);

  return (
    <div className="mx-auto w-full max-w-[420px] min-h-svh flex flex-col">
      <header className="px-6 pt-6 pb-3">
        <div className="text-[13px] text-ink-soft">Seu coach</div>
        <h1 className="font-bold uppercase tracking-[-0.02em] text-[28px] mt-1">Assistente Pulso</h1>
      </header>

      <ChatClient
        initialMessages={history ?? []}
        hasAnamnesis={Boolean(anamnesis)}
        aiConfigured={isAnthropicConfigured()}
      />

      <BottomNav />
    </div>
  );
}

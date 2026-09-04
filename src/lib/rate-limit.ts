import { createAdminClient } from "@/lib/supabase/admin";

type AiUsageKind = "chat" | "plan";

const LIMITS: Record<AiUsageKind, { max: number; windowHours: number; message: string }> = {
  chat: {
    max: 40,
    windowHours: 24,
    message: "Você atingiu o limite de mensagens do assistente por hoje. Tenta de novo amanhã.",
  },
  plan: {
    max: 10,
    windowHours: 24,
    message: "Você atingiu o limite de gerações de plano por hoje. Tenta de novo amanhã.",
  },
};

/**
 * Limite simples de uso da IA por usuário - protege contra um loop
 * (malicioso ou só um bug no cliente) batendo repetidamente numa Server
 * Action e gerando custo sem controle na API da Anthropic. Founders ficam
 * de fora: são as contas dos donos/early testers, não o vetor de abuso que
 * isso existe pra conter.
 */
export async function checkAndLogAiUsage(
  userId: string,
  kind: AiUsageKind,
  isFounder: boolean
): Promise<{ error: string } | null> {
  if (isFounder) return null;

  const admin = createAdminClient();
  const limit = LIMITS[kind];
  const since = new Date(Date.now() - limit.windowHours * 60 * 60 * 1000).toISOString();

  const { count, error } = await admin
    .from("ai_usage_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", kind)
    .gte("created_at", since);

  if (error) {
    // Erro de leitura não deveria travar o usuário por causa de um problema
    // nosso - deixa passar, só loga.
    console.error("[checkAndLogAiUsage] failed to count usage:", error);
    return null;
  }

  if ((count ?? 0) >= limit.max) {
    return { error: limit.message };
  }

  const { error: insertError } = await admin.from("ai_usage_log").insert({ user_id: userId, kind });
  if (insertError) {
    console.error("[checkAndLogAiUsage] failed to log usage:", insertError);
  }

  return null;
}

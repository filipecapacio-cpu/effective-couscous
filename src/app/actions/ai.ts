"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient, isAnthropicConfigured } from "@/lib/anthropic";
import { WeekPlanSchema, type WeekPlan } from "@/lib/ai-plan";
import { replaceTodayPlanWithAiPlan } from "@/app/actions/plan";
import {
  ACTIVITY_LABEL,
  EXPERIENCE_LABEL,
  SEX_LABEL,
  TRAINING_LOCATION_LABEL,
  type ActivityLevel,
  type Anamnesis,
  type ExperienceLevel,
  type Sex,
  type TrainingLocation,
} from "@/lib/anamnesis";

export type AiActionResult = { error: string } | { ok: true } | null;

function parseAnamnesisForm(formData: FormData): Anamnesis | { error: string } {
  const age = Number(formData.get("age"));
  const sex = String(formData.get("sex") ?? "") as Sex;
  const heightCm = Number(formData.get("height_cm"));
  const weightKg = Number(formData.get("weight_kg"));
  const goalWeightRaw = String(formData.get("goal_weight_kg") ?? "").trim();
  const activityLevel = String(formData.get("activity_level") ?? "") as ActivityLevel;
  const daysPerWeek = Number(formData.get("days_per_week"));
  const trainingLocation = String(formData.get("training_location") ?? "") as TrainingLocation;
  const experienceLevel = String(formData.get("experience_level") ?? "") as ExperienceLevel;
  const injuries = String(formData.get("injuries") ?? "").trim();
  const dietaryRestrictions = String(formData.get("dietary_restrictions") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!Number.isInteger(age) || age < 10 || age > 100) return { error: "Idade inválida." };
  if (!SEX_LABEL[sex]) return { error: "Selecione uma opção de sexo." };
  if (!Number.isInteger(heightCm) || heightCm < 100 || heightCm > 250) {
    return { error: "Altura inválida (em cm)." };
  }
  if (!(weightKg > 30 && weightKg < 300)) return { error: "Peso inválido (em kg)." };
  if (!ACTIVITY_LABEL[activityLevel]) return { error: "Selecione o nível de atividade." };
  if (!Number.isInteger(daysPerWeek) || daysPerWeek < 1 || daysPerWeek > 7) {
    return { error: "Dias por semana precisa ser entre 1 e 7." };
  }
  if (!TRAINING_LOCATION_LABEL[trainingLocation]) return { error: "Selecione onde você treina." };
  if (!EXPERIENCE_LABEL[experienceLevel]) return { error: "Selecione seu nível de experiência." };

  return {
    age,
    sex,
    height_cm: heightCm,
    weight_kg: weightKg,
    goal_weight_kg: goalWeightRaw ? Number(goalWeightRaw) : null,
    activity_level: activityLevel,
    days_per_week: daysPerWeek,
    training_location: trainingLocation,
    experience_level: experienceLevel,
    injuries: injuries || null,
    dietary_restrictions: dietaryRestrictions || null,
    notes: notes || null,
  };
}

function buildPlanPrompt(a: Anamnesis): string {
  return `Gere um plano semanal (segunda a domingo) de treino e dieta personalizado com base nesta anamnese:

- Idade: ${a.age} anos
- Sexo biológico: ${SEX_LABEL[a.sex]}
- Altura: ${a.height_cm} cm
- Peso atual: ${a.weight_kg} kg
- Peso objetivo: ${a.goal_weight_kg ? `${a.goal_weight_kg} kg` : "não informado"}
- Nível de atividade no dia a dia: ${ACTIVITY_LABEL[a.activity_level]}
- Dias disponíveis pra treinar por semana: ${a.days_per_week}
- Local de treino: ${TRAINING_LOCATION_LABEL[a.training_location]}
- Experiência com treino: ${EXPERIENCE_LABEL[a.experience_level]}
- Lesões ou restrições físicas: ${a.injuries ?? "nenhuma informada"}
- Restrições alimentares: ${a.dietary_restrictions ?? "nenhuma informada"}
- Observações adicionais: ${a.notes ?? "nenhuma"}

Monte exatamente ${a.days_per_week} dias de treino distribuídos pela semana (o resto deve ser
"restDay": true, com "exercises" e "meals" de descanso ativo/leve se fizer sentido, mas ainda
assim preencha as refeições de todos os 7 dias). Distribua os dias de treino de forma realista
(não empilhe todos seguidos sem necessidade). As refeições devem somar uma meta calórica
coerente com o objetivo e o peso informados. Considere as restrições físicas e alimentares
como inegociáveis. Responda em português do Brasil.`;
}

const SYSTEM_PROMPT = `Você é o coach de treino e nutrição do Onmode, um app de estilo de vida saudável
para pessoas que também trabalham ou estudam. Gere planos objetivos, realistas e seguros -
nunca recomende nada que contrarie uma lesão ou restrição alimentar informada. Não invente
diagnósticos médicos nem substitua acompanhamento profissional para condições de saúde sérias -
nesses casos, no campo "summary", recomende buscar um profissional além de dar o plano.`;

export async function saveAnamnesisAndGeneratePlan(formData: FormData): Promise<AiActionResult> {
  const parsed = parseAnamnesisForm(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const { error: saveError } = await supabase
    .from("anamneses")
    .upsert({ user_id: user.id, ...parsed, updated_at: new Date().toISOString() });
  if (saveError) {
    console.error("[saveAnamnesisAndGeneratePlan] failed to save anamnesis:", saveError);
    return { error: "Não deu pra salvar a anamnese agora. Tenta de novo em instantes." };
  }

  if (!isAnthropicConfigured()) {
    // Anamnese salva mesmo sem IA configurada - só não gera o plano ainda.
    revalidatePath("/dashboard");
    redirect("/dashboard");
  }

  const client = getAnthropicClient();
  let plan: WeekPlan;
  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPlanPrompt(parsed) }],
      output_config: { format: zodOutputFormat(WeekPlanSchema) },
    });
    if (!response.parsed_output) {
      return { error: "A resposta da IA veio incompleta. Tenta gerar de novo no seu perfil." };
    }
    plan = response.parsed_output;
  } catch (err) {
    console.error("[saveAnamnesisAndGeneratePlan] Anthropic API error:", err);
    return {
      error:
        "Não consegui gerar o plano agora. Sua anamnese foi salva - tenta gerar de novo no seu perfil em instantes.",
    };
  }

  const { error: planError } = await supabase.from("ai_plans").upsert({
    user_id: user.id,
    plan,
    model: "claude-opus-5",
    generated_at: new Date().toISOString(),
  });
  if (planError) {
    console.error("[saveAnamnesisAndGeneratePlan] failed to save plan:", planError);
    return { error: "O plano foi gerado mas não salvou. Tenta de novo em instantes." };
  }

  await replaceTodayPlanWithAiPlan(user.id, plan);

  revalidatePath("/dashboard");
  revalidatePath("/plano");
  revalidatePath("/perfil");
  redirect("/dashboard");
}

/** Regera o plano a partir da anamnese já salva (sem passar pelo formulário de novo). */
export async function regeneratePlan(): Promise<AiActionResult> {
  if (!isAnthropicConfigured()) {
    return { error: "Assistente de IA ainda não configurado nesta instalação." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const { data: anamnesis } = await supabase
    .from("anamneses")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!anamnesis) return { error: "Complete a anamnese primeiro." };

  const client = getAnthropicClient();
  let plan: WeekPlan;
  try {
    const response = await client.messages.parse({
      model: "claude-opus-5",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPlanPrompt(anamnesis as Anamnesis) }],
      output_config: { format: zodOutputFormat(WeekPlanSchema) },
    });
    if (!response.parsed_output) return { error: "A resposta da IA veio incompleta." };
    plan = response.parsed_output;
  } catch (err) {
    console.error("[regeneratePlan] Anthropic API error:", err);
    return { error: "Não consegui gerar o plano agora. Tenta de novo em instantes." };
  }

  const { error: planError } = await supabase.from("ai_plans").upsert({
    user_id: user.id,
    plan,
    model: "claude-opus-5",
    generated_at: new Date().toISOString(),
  });
  if (planError) {
    console.error("[regeneratePlan] failed to save plan:", planError);
    return { error: "O plano foi gerado mas não salvou." };
  }

  await replaceTodayPlanWithAiPlan(user.id, plan);

  revalidatePath("/dashboard");
  revalidatePath("/plano");
  revalidatePath("/perfil");
  return { ok: true };
}

const CHAT_SYSTEM_PROMPT = `Você é o assistente de treino e nutrição do Onmode. Responda de forma
direta, prática e curta (poucos parágrafos) - o usuário está no meio da rotina, não tem tempo
pra textão. Use o contexto da anamnese e do plano atual quando ajudar a resposta. Nunca
substitua avaliação médica para questões de saúde sérias - recomende buscar um profissional
nesses casos. Responda em português do Brasil.`;

export async function sendChatMessage(message: string): Promise<{ error: string } | { reply: string }> {
  const trimmed = message.trim();
  if (!trimmed) return { error: "Escreve alguma coisa antes de enviar." };
  if (!isAnthropicConfigured()) {
    return { error: "Assistente de IA ainda não configurado nesta instalação." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const [{ data: anamnesis }, { data: history }] = await Promise.all([
    supabase.from("anamneses").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(20),
  ]);

  const contextNote = anamnesis
    ? `Contexto do usuário - idade ${anamnesis.age}, objetivo de peso ${anamnesis.goal_weight_kg ?? "não informado"}, nível ${EXPERIENCE_LABEL[anamnesis.experience_level as ExperienceLevel]}, treina em ${TRAINING_LOCATION_LABEL[anamnesis.training_location as TrainingLocation]}, ${anamnesis.days_per_week}x/semana. Restrições: ${anamnesis.injuries ?? "-"} / ${anamnesis.dietary_restrictions ?? "-"}.`
    : "O usuário ainda não preencheu a anamnese - sugira preencher se a pergunta depender disso.";

  const client = getAnthropicClient();
  const messages: Anthropic.MessageParam[] = [
    ...(history ?? []).map((m): Anthropic.MessageParam => ({
      role: m.role as "user" | "assistant",
      content: m.content as string,
    })),
    { role: "user", content: trimmed },
  ];

  let reply: string;
  try {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      system: `${CHAT_SYSTEM_PROMPT}\n\n${contextNote}`,
      messages,
    });
    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text"
    );
    reply = textBlock?.text ?? "Não consegui pensar numa resposta agora — tenta reformular?";
  } catch (err) {
    console.error("[sendChatMessage] Anthropic API error:", err);
    return { error: "Não consegui responder agora. Tenta de novo em instantes." };
  }

  const { error: insertError } = await supabase.from("chat_messages").insert([
    { user_id: user.id, role: "user", content: trimmed },
    { user_id: user.id, role: "assistant", content: reply },
  ]);
  if (insertError) {
    console.error("[sendChatMessage] failed to persist messages:", insertError);
  }

  revalidatePath("/assistente");
  return { reply };
}

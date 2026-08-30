"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { describeAnthropicError, getAnthropicClient, isAnthropicConfigured } from "@/lib/anthropic";
import { WeekPlanSchema, type WeekPlan } from "@/lib/ai-plan";
import { replaceTodayPlanWithAiPlan } from "@/app/actions/plan";
import { GOAL_LABEL, type Goal } from "@/lib/plan";
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

function buildPlanPrompt(a: Anamnesis, goal: Goal | null): string {
  const weightDirection =
    a.goal_weight_kg == null
      ? null
      : a.goal_weight_kg < a.weight_kg
        ? "perder peso"
        : a.goal_weight_kg > a.weight_kg
          ? "ganhar peso"
          : "manter o peso";

  return `Gere um plano semanal (segunda a domingo) de treino e dieta personalizado com base nesta anamnese:

- Objetivo principal escolhido pelo usuário no app: ${goal ? GOAL_LABEL[goal] : "não informado"}
- Idade: ${a.age} anos
- Sexo biológico: ${SEX_LABEL[a.sex]}
- Altura: ${a.height_cm} cm
- Peso atual: ${a.weight_kg} kg
- Peso objetivo: ${a.goal_weight_kg ? `${a.goal_weight_kg} kg (${weightDirection})` : "não informado"}
- Nível de atividade no dia a dia: ${ACTIVITY_LABEL[a.activity_level]}
- Dias disponíveis pra treinar por semana: ${a.days_per_week}
- Local de treino: ${TRAINING_LOCATION_LABEL[a.training_location]}
- Experiência com treino: ${EXPERIENCE_LABEL[a.experience_level]}
- Lesões ou restrições físicas: ${a.injuries ?? "nenhuma informada"}
- Restrições alimentares: ${a.dietary_restrictions ?? "nenhuma informada"}
- Observações adicionais: ${a.notes ?? "nenhuma"}

Regras do treino:
- Monte exatamente ${a.days_per_week} dias de treino distribuídos pela semana de forma realista
  (não empilhe todos seguidos sem necessidade); o resto deve ser "restDay": true, com sugestão
  leve de mobilidade/alongamento se fizer sentido.
- Use só equipamento compatível com "${TRAINING_LOCATION_LABEL[a.training_location]}" — nunca
  prescreva barra, halteres ou máquina se o local for em casa sem equipamento.
- Ajuste séries, reps e complexidade dos exercícios ao nível de experiência informado —
  iniciante começa com volume/complexidade menor, avançado pode ter mais volume e intensidade.
- Varie os exercícios ao longo da semana em vez de repetir o mesmo treino em dois dias
  diferentes, mesmo quando o objetivo/grupo muscular se repete.
- Ainda assim preencha as refeições de todos os 7 dias, inclusive nos dias de descanso.

Regras da dieta:
- Estime a meta calórica diária a partir do peso, altura, idade, sexo e nível de atividade
  informados, e ajuste pro objetivo: déficit moderado (~15-20% abaixo da manutenção) pra quem
  quer perder peso, superávit moderado (~10-15% acima) pra quem quer ganhar peso, manutenção
  nos demais casos.
- Distribua essa meta calórica entre as refeições do dia de forma equilibrada.
- Considere as restrições físicas e alimentares como inegociáveis — nunca sugira algo que as
  contrarie.

Responda em português do Brasil.`;
}

const PLAN_JSON_FORMAT = `Responda APENAS com um objeto JSON válido, sem markdown, sem crases,
sem texto antes ou depois - só o JSON puro, exatamente neste formato:

{
  "summary": "string - 2-3 frases explicando a lógica do plano pro usuário",
  "monday": DayPlan, "tuesday": DayPlan, "wednesday": DayPlan, "thursday": DayPlan,
  "friday": DayPlan, "saturday": DayPlan, "sunday": DayPlan
}

Onde cada DayPlan é:
{
  "restDay": true ou false,
  "workoutTitle": "string",
  "durationMin": número inteiro (minutos; 0 se restDay),
  "exercises": [{ "name": "string", "detail": "string, ex: '3 séries · 10-12 reps'" }, ...] (até 10 itens; [] se restDay),
  "meals": [{ "name": "string, ex: 'Almoço'", "detail": "string, o que comer", "kcal": número inteiro }, ...] (até 6 itens, sempre preenchido mesmo em dia de descanso)
}`;

const SYSTEM_PROMPT = `Você é o coach de treino e nutrição do Onmode, um app de estilo de vida saudável
para pessoas que também trabalham ou estudam. Gere planos objetivos, realistas e seguros -
nunca recomende nada que contrarie uma lesão ou restrição alimentar informada. Não invente
diagnósticos médicos nem substitua acompanhamento profissional para condições de saúde sérias -
nesses casos, no campo "summary", recomende buscar um profissional além de dar o plano.

${PLAN_JSON_FORMAT}`;

/** Extrai o texto de uma resposta, tolerando o modelo envolver o JSON em ```json ... ```. */
function extractJsonText(raw: string): string {
  const fenced = raw.trim().match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : raw).trim();
}

const PRIMARY_MODEL = "claude-opus-5";
/**
 * Modelo de reserva - só entra em ação se o claude-opus-5 recusar a chamada
 * (ex: conta muito nova ainda sem acesso liberado ao modelo mais novo). Nunca
 * usado por custo/preferência, só pra não deixar a função de IA inteira fora
 * do ar por causa disso.
 */
const FALLBACK_MODEL = "claude-sonnet-5";

async function withModelFallback<T>(fn: (model: string) => Promise<T>): Promise<T> {
  try {
    return await fn(PRIMARY_MODEL);
  } catch (err) {
    if (err instanceof Anthropic.APIError && !(err instanceof Anthropic.RateLimitError)) {
      console.error(
        `[withModelFallback] ${PRIMARY_MODEL} failed (status ${err.status}): ${err.message} - retrying with ${FALLBACK_MODEL}`
      );
      return await fn(FALLBACK_MODEL);
    }
    throw err;
  }
}

/**
 * Pede o plano semanal em streaming (evita timeout em respostas grandes) e valida
 * o JSON manualmente com o schema - mais robusto que depender do recurso de
 * structured output da API pra um schema profundo como esse.
 */
async function generateWeekPlan(client: Anthropic, userPrompt: string): Promise<{ plan: WeekPlan; model: string }> {
  const response = await withModelFallback((model) =>
    client.messages
      .stream(
        {
          model,
          max_tokens: 16000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        },
        // Timeout bem abaixo do maxDuration da página (60s): se passar disso,
        // falha rápido e limpo (e aciona o fallback de modelo) em vez de deixar
        // o usuário com a tela carregando pra sempre até o Vercel matar a função.
        { timeout: 50_000 }
      )
      .finalMessage()
  );

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock?.text) {
    throw new Error("A resposta da IA veio sem conteúdo de texto.");
  }

  let raw: unknown;
  try {
    raw = JSON.parse(extractJsonText(textBlock.text));
  } catch (err) {
    console.error("[generateWeekPlan] failed to parse JSON:", err, "\nraw:", textBlock.text.slice(0, 2000));
    throw new Error("A resposta da IA não veio em um formato válido.");
  }

  return { plan: WeekPlanSchema.parse(raw), model: response.model };
}

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

  const { data: profile } = await supabase.from("profiles").select("goal").eq("id", user.id).maybeSingle();
  const goal = (profile?.goal as Goal | null) ?? null;

  const client = getAnthropicClient();
  let plan: WeekPlan;
  let model: string;
  try {
    ({ plan, model } = await generateWeekPlan(client, buildPlanPrompt(parsed, goal)));
  } catch (err) {
    console.error("[saveAnamnesisAndGeneratePlan] plan generation failed:", err);
    const detail = err instanceof Anthropic.APIError ? describeAnthropicError(err) : "A resposta da IA veio num formato inesperado.";
    return { error: `${detail} Sua anamnese foi salva - tenta gerar de novo no seu perfil.` };
  }

  const { error: planError } = await supabase.from("ai_plans").upsert({
    user_id: user.id,
    plan,
    model,
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

  const [{ data: anamnesis }, { data: profile }] = await Promise.all([
    supabase.from("anamneses").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("goal").eq("id", user.id).maybeSingle(),
  ]);
  if (!anamnesis) return { error: "Complete a anamnese primeiro." };
  const goal = (profile?.goal as Goal | null) ?? null;

  const client = getAnthropicClient();
  let plan: WeekPlan;
  let model: string;
  try {
    ({ plan, model } = await generateWeekPlan(client, buildPlanPrompt(anamnesis as Anamnesis, goal)));
  } catch (err) {
    console.error("[regeneratePlan] plan generation failed:", err);
    return { error: err instanceof Anthropic.APIError ? describeAnthropicError(err) : "A resposta da IA veio num formato inesperado. Tenta de novo." };
  }

  const { error: planError } = await supabase.from("ai_plans").upsert({
    user_id: user.id,
    plan,
    model,
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

  const [{ data: anamnesis }, { data: profile }, { data: history }] = await Promise.all([
    supabase.from("anamneses").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("goal").eq("id", user.id).maybeSingle(),
    supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(20),
  ]);
  const goal = (profile?.goal as Goal | null) ?? null;

  const contextNote = anamnesis
    ? `Contexto do usuário - objetivo principal ${goal ? GOAL_LABEL[goal] : "não informado"}, idade ${anamnesis.age}, objetivo de peso ${anamnesis.goal_weight_kg ?? "não informado"}, nível ${EXPERIENCE_LABEL[anamnesis.experience_level as ExperienceLevel]}, treina em ${TRAINING_LOCATION_LABEL[anamnesis.training_location as TrainingLocation]}, ${anamnesis.days_per_week}x/semana. Restrições: ${anamnesis.injuries ?? "-"} / ${anamnesis.dietary_restrictions ?? "-"}.`
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
    const response = await withModelFallback((model) =>
      client.messages.create(
        {
          model,
          max_tokens: 1024,
          system: `${CHAT_SYSTEM_PROMPT}\n\n${contextNote}`,
          messages,
        },
        { timeout: 25_000 }
      )
    );
    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text"
    );
    reply = textBlock?.text ?? "Não consegui pensar numa resposta agora — tenta reformular?";
  } catch (err) {
    console.error("[sendChatMessage] Anthropic API error:", err);
    return { error: describeAnthropicError(err) };
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

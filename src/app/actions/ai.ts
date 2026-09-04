"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { describeAnthropicError, getAnthropicClient, isAnthropicConfigured } from "@/lib/anthropic";
import { WeekPlanSchema, type WeekPlan } from "@/lib/ai-plan";
import { replaceTodayPlanWithAiPlan, replaceTodayMealsOnly } from "@/app/actions/plan";
import { GOAL_LABEL, type Goal } from "@/lib/plan";
import { hasPlanFeature, type ProfilePlanTier } from "@/lib/plans";
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

const AI_LOCKED_MESSAGE = "O assistente de IA é uma funcionalidade dos planos Pro e Elite.";

/**
 * O assistente de IA (anamnese, regerar plano, chat) é funcionalidade paga.
 * A tela já esconde os botões/formulários pra quem não tem acesso, mas isso
 * sozinho não impede a Server Action de ser chamada direto - então cada
 * ação de IA confere de novo aqui, no servidor, antes de gastar uma
 * chamada de verdade pra API da Anthropic.
 */
async function requireAiAccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<{ error: string } | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_tier, is_founder")
    .eq("id", userId)
    .single();

  const allowed = hasPlanFeature(
    profile as { plan_tier: ProfilePlanTier; is_founder: boolean } | null,
    "pro"
  );
  return allowed ? null : { error: AI_LOCKED_MESSAGE };
}

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
        // Timeout bem abaixo do maxDuration da página (60s), com maxRetries: 0
        // pra não deixar o SDK tentar de novo sozinho (o padrão é até 2 vezes,
        // o que multiplicaria o timeout e travaria a tela de novo). Se estourar,
        // falha rápido e limpo, o que também aciona o fallback de modelo.
        { timeout: 40_000, maxRetries: 0 }
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

  const accessError = await requireAiAccess(supabase, user.id);
  if (accessError) return accessError;

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

  const accessError = await requireAiAccess(supabase, user.id);
  if (accessError) return accessError;

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
nesses casos. Quando o usuário pedir pra você gerar, montar, lançar ou atualizar a dieta/plano
alimentar de hoje, use a ferramenta lancar_plano_alimentar em vez de só descrever as refeições em
texto - só assim a aba Dieta do app é atualizada de verdade. Estime a meta calórica a partir do
perfil da anamnese (peso, altura, idade, atividade) e do objetivo, e respeite restrições
alimentares informadas como inegociáveis. Responda em português do Brasil.`;

/** Ferramenta que o chat pode acionar pra lançar a dieta de hoje de verdade (não só descrever em texto). */
const LAUNCH_DIET_TOOL: Anthropic.Tool = {
  name: "lancar_plano_alimentar",
  description:
    "Lança um plano alimentar como a dieta de HOJE do usuário no app (aba Plano > Dieta), substituindo as refeições de hoje que já existirem. NÃO mexe no treino. Use sempre que o usuário pedir pra gerar, montar, lançar ou atualizar a dieta/plano alimentar de hoje.",
  input_schema: {
    type: "object",
    properties: {
      meals: {
        type: "array",
        description: "As refeições do dia, na ordem em que acontecem (café da manhã primeiro).",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Ex: 'Café da manhã', 'Almoço', 'Jantar'" },
            detail: { type: "string", description: "O que comer, de forma objetiva e específica" },
            kcal: { type: "integer", description: "Estimativa de calorias da refeição" },
          },
          required: ["name", "detail", "kcal"],
        },
        minItems: 1,
        maxItems: 8,
      },
    },
    required: ["meals"],
  },
};

const LaunchDietInputSchema = z.object({
  meals: z
    .array(
      z.object({
        name: z.string().min(1),
        detail: z.string().min(1),
        kcal: z.number().int().min(0).max(3000),
      })
    )
    .min(1)
    .max(8),
});

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
    supabase.from("profiles").select("goal, plan_tier, is_founder").eq("id", user.id).maybeSingle(),
    supabase
      .from("chat_messages")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(20),
  ]);

  if (!hasPlanFeature(profile as { plan_tier: ProfilePlanTier; is_founder: boolean } | null, "pro")) {
    return { error: AI_LOCKED_MESSAGE };
  }

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

  const system = `${CHAT_SYSTEM_PROMPT}\n\n${contextNote}`;
  let reply: string;
  let dietUpdated = false;
  try {
    let response = await withModelFallback((model) =>
      client.messages.create(
        // max_tokens mais folgado que o resto do chat: dá pra cortar a
        // chamada da ferramenta no meio (até 8 refeições detalhadas) se
        // ficar curto - foi exatamente isso que causou o primeiro bug daqui.
        { model, max_tokens: 4096, system, messages, tools: [LAUNCH_DIET_TOOL] },
        { timeout: 25_000, maxRetries: 0 }
      )
    );
    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "max_tokens") {
      console.error("[sendChatMessage] response truncated by max_tokens before completing");
      return { error: "A resposta ficou grande demais e cortou no meio. Tenta pedir de novo, talvez de forma mais simples." };
    }

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === "lancar_plano_alimentar"
    );

    if (toolUse) {
      const parsed = LaunchDietInputSchema.safeParse(toolUse.input);
      let toolResultContent: string;
      let isError = false;

      if (!parsed.success) {
        console.error("[sendChatMessage] invalid tool input:", parsed.error, toolUse.input);
        toolResultContent = "Os dados enviados não são válidos - confere o formato e tenta de novo.";
        isError = true;
      } else {
        const result = await replaceTodayMealsOnly(user.id, parsed.data.meals);
        if ("error" in result) {
          toolResultContent = result.error;
          isError = true;
        } else {
          toolResultContent = "Dieta de hoje atualizada com sucesso.";
          dietUpdated = true;
        }
      }

      messages.push({
        role: "user",
        content: [
          { type: "tool_result", tool_use_id: toolUse.id, content: toolResultContent, is_error: isError },
        ],
      });

      // Segunda chamada só pra pegar a confirmação em texto - sem tools, não
      // precisa (nem deve) chamar a ferramenta de novo nessa resposta.
      response = await withModelFallback((model) =>
        client.messages.create(
          { model, max_tokens: 1024, system, messages },
          { timeout: 25_000, maxRetries: 0 }
        )
      );
    }

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    reply =
      textBlock?.text ??
      (dietUpdated ? "Prontinho, atualizei sua dieta de hoje!" : "Não consegui pensar numa resposta agora — tenta reformular?");
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
  if (dietUpdated) {
    revalidatePath("/plano");
    revalidatePath("/dashboard");
  }
  return { reply };
}

"use server";

import { headers } from "next/headers";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type Anthropic from "@anthropic-ai/sdk";
import {
  describeAnthropicError,
  getAnthropicClient,
  isAnthropicConfigured,
  withModelFallback,
} from "@/lib/anthropic";
import { registrarUsoAnonimo } from "@/lib/rate-limit-anon";
import { AnaliseSchema, SYSTEM_PROMPT, type Analise } from "@/lib/leitor-conversa-ia";
import { MAX_BYTES_POR_PRINT, MAX_PRINTS, TIPOS_ACEITOS } from "@/lib/leitor-conversa";

export type ResultadoAnalise = { error: string } | { ok: true; analise: Analise };

type TipoAceito = (typeof TIPOS_ACEITOS)[number];

function ehTipoAceito(tipo: string): tipo is TipoAceito {
  return (TIPOS_ACEITOS as readonly string[]).includes(tipo);
}

/** Identifica o chamador só pra contar uso - não é guardado em lugar nenhum. */
async function chaveDoChamador(): Promise<string> {
  const h = await headers();
  const encaminhado = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return encaminhado || h.get("x-real-ip") || "desconhecido";
}

const INSTRUCAO_FINAL = `Analise a conversa desses prints seguindo as suas regras: leia os sinais, diga como está o
clima, aponte o que quem mandou o print pode estar errando na forma de conversar e sugira
de 2 a 3 direções possíveis pra próxima mensagem - sem escrever a mensagem pronta.`;

/**
 * Lê os prints enviados e devolve a análise de tom. Ação pública (a ferramenta
 * não tem login), então tudo que vem do formulário é tratado como não
 * confiável: quantidade, tipo e tamanho conferidos de novo aqui.
 */
export async function analisarConversa(formData: FormData): Promise<ResultadoAnalise> {
  if (!isAnthropicConfigured()) {
    return { error: "O Leitor de Conversa ainda não foi configurado nesta instalação." };
  }

  const arquivos = formData.getAll("prints").filter((v): v is File => v instanceof File && v.size > 0);

  if (arquivos.length === 0) {
    return { error: "Manda pelo menos um print da conversa." };
  }
  if (arquivos.length > MAX_PRINTS) {
    return { error: `Dá pra analisar até ${MAX_PRINTS} prints de uma vez.` };
  }
  for (const arquivo of arquivos) {
    if (!ehTipoAceito(arquivo.type)) {
      return { error: "Formato não suportado. Manda os prints em PNG, JPG, WEBP ou GIF." };
    }
    if (arquivo.size > MAX_BYTES_POR_PRINT) {
      return { error: "Cada print precisa ter menos de 5 MB." };
    }
  }

  const limite = registrarUsoAnonimo(await chaveDoChamador());
  if (limite) return limite;

  const conteudo: Anthropic.ContentBlockParam[] = [];
  for (const [indice, arquivo] of arquivos.entries()) {
    conteudo.push({ type: "text", text: `Print ${indice + 1} de ${arquivos.length}:` });
    conteudo.push({
      type: "image",
      source: {
        type: "base64",
        media_type: arquivo.type as TipoAceito,
        data: Buffer.from(await arquivo.arrayBuffer()).toString("base64"),
      },
    });
  }
  conteudo.push({ type: "text", text: INSTRUCAO_FINAL });

  const client = getAnthropicClient();

  try {
    const response = await withModelFallback((model) =>
      client.messages.parse(
        {
          model,
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          // "medium" em vez do padrão "high": a leitura de um punhado de prints
          // não precisa do raciocínio mais caro, e a tela é síncrona - o usuário
          // fica esperando com a bolinha girando até a resposta chegar.
          output_config: { effort: "medium", format: zodOutputFormat(AnaliseSchema) },
          messages: [{ role: "user", content: conteudo }],
        },
        // Timeout abaixo do maxDuration da página (60s) e maxRetries: 0 pra o
        // SDK não tentar de novo sozinho e multiplicar a espera.
        { timeout: 45_000, maxRetries: 0 }
      )
    );

    if (response.stop_reason === "refusal") {
      console.error("[analisarConversa] refusal:", response.stop_details);
      return {
        error:
          "A IA preferiu não analisar esses prints. Isso costuma acontecer quando a conversa tem conteúdo sensível.",
      };
    }
    if (!response.parsed_output) {
      console.error("[analisarConversa] resposta sem parsed_output:", response.stop_reason);
      return { error: "A IA respondeu num formato que eu não consegui ler. Tenta de novo." };
    }

    return { ok: true, analise: response.parsed_output };
  } catch (err) {
    console.error("[analisarConversa] Anthropic API error:", err);
    return { error: describeAnthropicError(err) };
  }
}

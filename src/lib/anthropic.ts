import Anthropic from "@anthropic-ai/sdk";

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/** Cliente da API da Anthropic para uso em Server Actions. */
export function getAnthropicClient(): Anthropic {
  if (!isAnthropicConfigured()) {
    throw new Error("Assistente de IA não configurado: defina ANTHROPIC_API_KEY em .env.local");
  }
  return new Anthropic();
}

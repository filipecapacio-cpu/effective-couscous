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

/**
 * Traduz um erro da API da Anthropic numa mensagem específica pro usuário -
 * em vez de um "tenta de novo" genérico pra qualquer falha (chave inválida,
 * sem crédito, limite de taxa, timeout são coisas bem diferentes de resolver).
 */
export function describeAnthropicError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) {
    return "A chave da API da Anthropic está inválida ou não foi configurada corretamente nesta instalação.";
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return "A conta da Anthropic recusou a chamada - confere se há crédito disponível em console.anthropic.com.";
  }
  if (err instanceof Anthropic.RateLimitError) {
    return "Limite de uso da IA atingido no momento. Tenta de novo em alguns minutos.";
  }
  if (err instanceof Anthropic.APIConnectionTimeoutError) {
    return "A IA demorou demais pra responder. Tenta de novo - planos maiores levam mais tempo.";
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return "Não deu pra conectar com a IA agora. Tenta de novo em instantes.";
  }
  if (err instanceof Anthropic.APIError) {
    console.error("[describeAnthropicError] unhandled API error detail:", err.status, err.error ?? err.message);
    return "A IA não conseguiu processar essa solicitação agora. Tenta de novo em instantes.";
  }
  return "Não consegui falar com a IA agora. Tenta de novo em instantes.";
}

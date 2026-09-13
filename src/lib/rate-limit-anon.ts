/**
 * Limite de uso por IP para as ferramentas abertas (sem login), onde não
 * existe user_id pra contar no banco como o resto da IA faz.
 *
 * ATENÇÃO ao que isso é e ao que não é: a contagem vive na memória do
 * processo. Em serverless cada instância tem a sua, e todas somem no próximo
 * deploy - então isso segura um F5 nervoso e um script ingênuo, não um abuso
 * distribuído de verdade. Se a ferramenta crescer, o lugar certo é uma tabela
 * (como ai_usage_log) ou um Redis compartilhado.
 */

const JANELA_MS = 60 * 60 * 1000;
const MAX_NA_JANELA = 6;
/** Teto de chaves guardadas, pra memória não crescer sem limite. */
const MAX_CHAVES = 5000;

const historico = new Map<string, number[]>();

function limpar(agora: number) {
  for (const [chave, marcas] of historico) {
    const vivas = marcas.filter((t) => agora - t < JANELA_MS);
    if (vivas.length === 0) historico.delete(chave);
    else historico.set(chave, vivas);
  }
}

/**
 * Conta mais um uso para `chave` (normalmente o IP). Devolve a mensagem de
 * erro quando o limite já estourou, ou null quando pode seguir.
 */
export function registrarUsoAnonimo(chave: string): { error: string } | null {
  const agora = Date.now();
  limpar(agora);

  if (historico.size >= MAX_CHAVES && !historico.has(chave)) {
    // Balde cheio de IPs diferentes: em vez de crescer pra sempre, zera e
    // recomeça a janela. Perde-se histórico, não memória.
    historico.clear();
  }

  const marcas = historico.get(chave) ?? [];
  if (marcas.length >= MAX_NA_JANELA) {
    return {
      error: `Você já fez ${MAX_NA_JANELA} análises na última hora. Espera um pouco e tenta de novo.`,
    };
  }

  marcas.push(agora);
  historico.set(chave, marcas);
  return null;
}

/**
 * Quantos prints dá pra mandar de uma vez. Conversa longa fica melhor em
 * prints separados do que num print gigante espremido.
 */
export const MAX_PRINTS = 4;

/** Limite por arquivo, conferido no navegador e de novo no servidor. */
export const MAX_BYTES_POR_PRINT = 5 * 1024 * 1024;

/** Formatos que a API da Anthropic aceita como imagem. */
export const TIPOS_ACEITOS = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;

/**
 * Maior lado da imagem depois do redimensionamento feito no navegador. É o
 * mesmo teto que a API aplica sozinha do lado dela, então encolher antes não
 * tira nada do que o modelo enxerga - só economiza upload e tokens.
 */
export const MAIOR_LADO_PX = 1568;

export const ENGAJAMENTO_LABEL = {
  alto: "Engajamento alto",
  neutro: "Engajamento neutro",
  baixo: "Engajamento baixo",
} as const;

/**
 * Fuso horário assumido pro app - hoje só temos usuários no Brasil.
 *
 * Todo cálculo de "hoje" precisa passar por aqui, nunca usar `new Date()`
 * do servidor direto: o servidor roda em UTC, então à noite (a partir de
 * ~21h no horário de Brasília) o relógio do servidor já virou o dia
 * seguinte, mesmo ainda sendo "hoje" de verdade pro usuário. Foi esse o bug
 * de agenda/treino/dieta "adiantando" o dia à noite.
 */
export const APP_TIME_ZONE = "America/Sao_Paulo";

/** Data de hoje (YYYY-MM-DD) no fuso do app - não no fuso (UTC) do servidor. */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE }).format(new Date());
}

/**
 * Desloca uma data ISO (YYYY-MM-DD) em N dias. Ancorado ao meio-dia UTC pra
 * dar o mesmo resultado não importa o fuso do processo que rodar isso.
 */
export function addDaysISO(dateISO: string, days: number): string {
  const d = new Date(`${dateISO}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Dia da semana (0 = domingo) de uma data ISO (YYYY-MM-DD). Mesma lógica de
 * ancoragem de `addDaysISO` - seguro pra qualquer fuso do processo.
 */
export function weekdayOfISO(dateISO: string): number {
  return new Date(`${dateISO}T12:00:00Z`).getUTCDay();
}

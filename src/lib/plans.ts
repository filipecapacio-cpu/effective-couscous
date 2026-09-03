/** Preços e regras dos planos pagos do Onmode — fonte única da verdade. */

export type PlanTier = "pro" | "elite";
export type BillingCycle = "monthly" | "annual";

export const TRIAL_DAYS = 7;

export const PLAN_PRICES: Record<PlanTier, Record<BillingCycle, number>> = {
  pro: { monthly: 39.9, annual: 299 },
  elite: { monthly: 59.9, annual: 449 },
};

export const PLAN_LABELS: Record<PlanTier, string> = {
  pro: "Pro",
  elite: "Elite",
};

export const PLAN_FEATURES: Record<PlanTier, string[]> = {
  pro: [
    "Assistente de IA: plano semanal gerado automaticamente pela anamnese",
    "Chat com o assistente pra ajustar o plano quando quiser",
    "Card de treino estilo Strava pra compartilhar no Instagram/WhatsApp",
    "Gráfico de carga de treino dos últimos 7 dias",
  ],
  elite: [
    "Tudo do Pro",
    "Histórico completo de consistência (heatmap mensal no Perfil)",
    "Resumo semanal detalhado de treinos e consistência",
    "Suporte prioritário",
  ],
};

export function planPrice(tier: PlanTier, cycle: BillingCycle): number {
  return PLAN_PRICES[tier][cycle];
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

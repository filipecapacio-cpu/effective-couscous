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
    "Sincronização completa Garmin",
    "Readiness score com recomendação diária",
    "Histórico ilimitado e gráficos de tendência",
    "Baseline pessoal calculado",
  ],
  elite: [
    "Tudo do Pro",
    "Alertas preditivos de overtraining",
    "Comparação avançada com baseline",
    "Export de dados",
  ],
};

export function planPrice(tier: PlanTier, cycle: BillingCycle): number {
  return PLAN_PRICES[tier][cycle];
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

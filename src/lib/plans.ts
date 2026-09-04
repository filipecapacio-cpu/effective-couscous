/** Preços e regras dos planos pagos do Onmode — fonte única da verdade. */

export type PlanTier = "pro" | "elite";
export type BillingCycle = "monthly" | "annual";

/** `profiles.plan_tier` inclui "free" também (quem nunca assinou nada). */
export type ProfilePlanTier = "free" | PlanTier;

const PLAN_TIER_RANK: Record<ProfilePlanTier, number> = { free: 0, pro: 1, elite: 2 };

/**
 * true se `tier` dá acesso a pelo menos o nível de `min` (free < pro < elite).
 * Usado pra gatear funcionalidades específicas por plano nas telas do app.
 */
export function tierAtLeast(tier: ProfilePlanTier | null | undefined, min: ProfilePlanTier): boolean {
  return PLAN_TIER_RANK[tier ?? "free"] >= PLAN_TIER_RANK[min];
}

/**
 * Checagem de acesso a usar nas telas: já leva em conta os "founders" -
 * quem criou conta antes dos planos pagos existirem e ganhou acesso a tudo
 * pra sempre (profiles.is_founder). Usar isso em vez de tierAtLeast direto
 * sempre que a checagem envolver um usuário de verdade.
 */
export function hasPlanFeature(
  profile: { plan_tier?: ProfilePlanTier | null; is_founder?: boolean | null } | null | undefined,
  min: ProfilePlanTier
): boolean {
  if (profile?.is_founder) return true;
  return tierAtLeast(profile?.plan_tier, min);
}

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

/** Aplica um desconto percentual a um preço, arredondado pra 2 casas (centavos). */
export function applyDiscount(price: number, discountPercent: number): number {
  return Math.round(price * (1 - discountPercent / 100) * 100) / 100;
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CreditCardIcon, XIcon } from "@/components/icons";
import CancelSubscriptionButton from "@/components/CancelSubscriptionButton";
import { changePlan } from "@/app/actions/subscription";
import { PLAN_LABELS, formatBRL, planPrice, type PlanTier, type BillingCycle } from "@/lib/plans";

const STATUS_LABELS: Record<string, string> = {
  trialing: "Em teste grátis",
  active: "Ativa",
  past_due: "Pagamento pendente",
  canceled: "Cancelada",
  none: "Sem assinatura",
};

const PLAN_COMBOS: { tier: PlanTier; cycle: BillingCycle }[] = [
  { tier: "pro", cycle: "annual" },
  { tier: "pro", cycle: "monthly" },
  { tier: "elite", cycle: "annual" },
  { tier: "elite", cycle: "monthly" },
];

export default function SubscriptionManageModal({
  planTier,
  billingCycle,
  subscriptionStatus,
  canManage,
  canCancel,
}: {
  planTier: PlanTier | "free";
  billingCycle: BillingCycle | null;
  subscriptionStatus: string;
  canManage: boolean;
  canCancel: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingCombo, setPendingCombo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleChangePlan(tier: PlanTier, cycle: BillingCycle) {
    setError(null);
    setPendingCombo(`${tier}-${cycle}`);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("tier", tier);
      formData.set("cycle", cycle);
      const result = await changePlan(formData);
      if ("error" in result) setError(result.error);
      setPendingCombo(null);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Gerenciar assinatura"
        className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0"
      >
        <CreditCardIcon size={15} className="text-on-ink-soft" />
      </button>

      {open && (
        <div className="fixed inset-0 z-20 bg-ink-bg/95 backdrop-blur-sm flex items-end sm:items-center justify-center p-5">
          <div className="w-full max-w-sm bg-ink-bg-2 border border-white/10 rounded-lg p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold uppercase tracking-[-0.02em] text-2xl text-on-ink">
                Assinatura
              </h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar">
                <XIcon size={18} className="text-on-ink-soft" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-lg bg-white/5">
              <div className="text-[14px] font-semibold text-on-ink">
                {planTier === "free" ? "Plano Free" : `Plano ${PLAN_LABELS[planTier]}`}
              </div>
              <span className="text-[11px] font-mono uppercase tracking-[0.08em] text-on-ink-faint">
                {STATUS_LABELS[subscriptionStatus] ?? subscriptionStatus}
              </span>
            </div>

            {subscriptionStatus === "past_due" && (
              <Link href="/assinatura" className="text-[13px] text-accent underline underline-offset-2">
                Regularizar pagamento
              </Link>
            )}

            {canManage ? (
              <>
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-mono uppercase tracking-[0.06em] text-on-ink-soft">
                    Trocar de plano
                  </span>
                  {PLAN_COMBOS.map(({ tier, cycle }) => {
                    const isCurrent = tier === planTier && cycle === billingCycle;
                    const comboKey = `${tier}-${cycle}`;
                    return (
                      <button
                        key={comboKey}
                        onClick={() => handleChangePlan(tier, cycle)}
                        disabled={isCurrent || pending}
                        className="flex items-center justify-between p-3 rounded-lg border border-white/10 text-left disabled:opacity-40"
                      >
                        <span className="text-[13px] text-on-ink">
                          {PLAN_LABELS[tier]} · {cycle === "annual" ? "anual" : "mensal"}
                        </span>
                        <span className="text-[12px] text-on-ink-soft">
                          {isCurrent ? "Atual" : pendingCombo === comboKey ? "Trocando…" : formatBRL(planPrice(tier, cycle))}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {error && <div className="text-sm text-accent font-medium">{error}</div>}

                {canCancel && (
                  <div className="pt-2 border-t border-white/10">
                    <CancelSubscriptionButton />
                  </div>
                )}
              </>
            ) : (
              <Link
                href="/assinatura"
                className="h-12 px-5 inline-flex items-center justify-center rounded bg-ink text-paper font-semibold text-[15px] hover:bg-accent transition-colors"
              >
                Ver planos
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}

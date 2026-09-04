"use client";

import { useActionState, useState } from "react";
import { startPlan, stayOnFree, type StartPlanResult } from "@/app/actions/subscription";
import { PLAN_FEATURES, PLAN_LABELS, TRIAL_DAYS, formatBRL, planPrice } from "@/lib/plans";

export default function PlanPicker() {
  const [coupon, setCoupon] = useState("");
  const [state, formAction, pending] = useActionState<StartPlanResult, FormData>(
    (_prev, formData) => startPlan(formData),
    null
  );

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-display font-bold uppercase tracking-[-0.02em] text-3xl">Escolha seu plano</h1>
        <p className="text-ink-soft text-[15px]">
          {TRIAL_DAYS} dias grátis em qualquer plano. Cancele quando quiser antes do fim do trial.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Cupom de desconto — opcional</span>
        <input
          value={coupon}
          onChange={(e) => setCoupon(e.target.value.toUpperCase())}
          placeholder="Ex: JOAO10"
          className="h-11 rounded border border-line bg-paper px-3.5 text-[15px] outline-none focus:border-ink uppercase"
        />
        {coupon && (
          <span className="text-xs text-ink-faint">
            Se o código for válido, o desconto entra automaticamente só na primeira cobrança.
          </span>
        )}
      </label>

      {state?.error && <div className="text-sm text-accent font-medium">{state.error}</div>}

      <div className="flex flex-col gap-4">
        {(["pro", "elite"] as const).map((tier) => (
          <div key={tier} className="border border-line rounded-lg p-5 flex flex-col gap-4">
            <div>
              <h2 className="font-display font-bold uppercase tracking-[-0.02em] text-xl">
                {PLAN_LABELS[tier]}
              </h2>
              <p className="text-ink-soft text-sm mt-1">
                {formatBRL(planPrice(tier, "annual"))}/ano · ou {formatBRL(planPrice(tier, "monthly"))}/mês
              </p>
            </div>

            <ul className="text-sm text-ink-soft flex flex-col gap-1.5">
              {PLAN_FEATURES[tier].map((feature) => (
                <li key={feature}>· {feature}</li>
              ))}
            </ul>

            <form action={formAction} className="flex flex-col gap-2">
              <input type="hidden" name="tier" value={tier} />
              <input type="hidden" name="cycle" value="annual" />
              <input type="hidden" name="coupon" value={coupon} />
              <button
                type="submit"
                disabled={pending}
                className="h-12 px-5 inline-flex items-center justify-center rounded bg-ink text-paper font-semibold text-[15px] hover:bg-accent transition-colors disabled:opacity-60"
              >
                {pending ? "Um momento…" : "Começar trial — plano anual"}
              </button>
            </form>
            <form action={formAction}>
              <input type="hidden" name="tier" value={tier} />
              <input type="hidden" name="cycle" value="monthly" />
              <input type="hidden" name="coupon" value={coupon} />
              <button
                type="submit"
                disabled={pending}
                className="text-sm text-ink-soft underline underline-offset-2 disabled:opacity-60"
              >
                Prefiro o mensal ({formatBRL(planPrice(tier, "monthly"))}/mês)
              </button>
            </form>
          </div>
        ))}
      </div>

      <form action={stayOnFree}>
        <button type="submit" className="w-full text-sm text-ink-soft underline underline-offset-2">
          Continuar no Free (sem assistente de IA)
        </button>
      </form>
    </>
  );
}

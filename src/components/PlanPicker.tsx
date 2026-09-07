"use client";

import { useActionState, useState } from "react";
import { startPlan, stayOnFree, type StartPlanResult } from "@/app/actions/subscription";
import {
  FREE_TAGLINE,
  PLAN_FEATURES,
  PLAN_LABELS,
  PLAN_TAGLINES,
  formatBRL,
  planPrice,
} from "@/lib/plans";

const PLAN_EMOJI: Record<"pro" | "elite", string> = { pro: "⚡", elite: "👑" };

export default function PlanPicker() {
  const [coupon, setCoupon] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [state, formAction, pending] = useActionState<StartPlanResult, FormData>(
    (_prev, formData) => startPlan(formData),
    null
  );

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="font-display font-bold uppercase tracking-[-0.02em] text-3xl">Escolha seu plano</h1>
        <p className="text-ink-soft text-[15px]">
          Assine agora e cancele quando quiser, sem multa nem fidelidade.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">CPF ou CNPJ</span>
        <input
          value={cpfCnpj}
          onChange={(e) => setCpfCnpj(e.target.value.replace(/\D/g, "").slice(0, 14))}
          inputMode="numeric"
          placeholder="Só números"
          className="h-11 rounded border border-line bg-paper px-3.5 text-[15px] outline-none focus:border-ink"
        />
        <span className="text-xs text-ink-faint">
          Exigido pra emitir a cobrança - só pedimos aqui se você escolher um plano pago.
        </span>
      </label>

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
        <div className="border border-line rounded-lg p-5 flex flex-col gap-4">
          <div>
            <h2 className="font-display font-bold uppercase tracking-[-0.02em] text-xl">Free</h2>
            <p className="text-ink-soft text-sm mt-1">{FREE_TAGLINE}</p>
            <p className="text-ink-soft text-sm mt-1">R$0</p>
          </div>
          <form action={stayOnFree}>
            <button
              type="submit"
              className="w-full h-12 px-5 inline-flex items-center justify-center rounded border border-line font-semibold text-[15px] hover:border-ink transition-colors"
            >
              Continuar no Free
            </button>
          </form>
        </div>

        {(["pro", "elite"] as const).map((tier) => (
          <div
            key={tier}
            className={`relative border rounded-lg p-5 flex flex-col gap-4 ${
              tier === "pro" ? "border-ink" : "border-line"
            }`}
          >
            {tier === "pro" && (
              <span className="absolute -top-3 left-5 bg-ink text-paper text-[11px] font-mono uppercase tracking-[0.08em] px-2.5 py-1 rounded">
                Mais popular
              </span>
            )}
            <div>
              <h2 className="font-display font-bold uppercase tracking-[-0.02em] text-xl">
                {PLAN_LABELS[tier]} <span aria-hidden="true">{PLAN_EMOJI[tier]}</span>
              </h2>
              <p className="text-ink-soft text-sm mt-1">{PLAN_TAGLINES[tier]}</p>
              <p className="text-ink-soft text-sm mt-1">
                {formatBRL(planPrice(tier, "monthly"))}/mês · ou {formatBRL(planPrice(tier, "annual"))}/ano
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
              <input type="hidden" name="cpfCnpj" value={cpfCnpj} />
              <button
                type="submit"
                disabled={pending}
                className="h-12 px-5 inline-flex items-center justify-center rounded bg-ink text-paper font-semibold text-[15px] hover:bg-accent transition-colors disabled:opacity-60"
              >
                {pending ? "Um momento…" : "Assinar — plano anual"}
              </button>
            </form>
            <form action={formAction}>
              <input type="hidden" name="tier" value={tier} />
              <input type="hidden" name="cycle" value="monthly" />
              <input type="hidden" name="coupon" value={coupon} />
              <input type="hidden" name="cpfCnpj" value={cpfCnpj} />
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
    </>
  );
}

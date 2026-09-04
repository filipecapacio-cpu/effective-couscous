"use client";

import { useActionState } from "react";
import { createInfluencerCoupon, type CreateInfluencerResult } from "@/app/actions/admin";

const inputClass =
  "h-11 rounded border border-line bg-paper px-3.5 text-[15px] outline-none focus:border-ink";
const labelClass = "flex flex-col gap-1.5";
const captionClass = "text-sm font-medium";

export default function CreateInfluencerForm() {
  const [state, formAction, pending] = useActionState<CreateInfluencerResult | null, FormData>(
    (_prev, formData) => createInfluencerCoupon(formData),
    null
  );

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            <span className={captionClass}>Nome do influencer</span>
            <input name="name" required className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className={captionClass}>E-mail (login dele)</span>
            <input name="email" type="email" required className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className={captionClass}>Código do cupom</span>
            <input name="code" required placeholder="Ex: JOAO10" className={`${inputClass} uppercase`} />
          </label>
          <label className={labelClass}>
            <span className={captionClass}>Desconto pro cliente (%)</span>
            <input name="discount_percent" type="number" min={1} max={100} required className={inputClass} />
          </label>
          <label className={`${labelClass} col-span-2`}>
            <span className={captionClass}>Comissão do influencer (%)</span>
            <input name="commission_percent" type="number" min={1} max={100} required className={inputClass} />
          </label>
        </div>

        {state && "error" in state && <div className="text-sm text-accent font-medium">{state.error}</div>}

        <button
          type="submit"
          disabled={pending}
          className="h-12 rounded bg-ink text-paper font-semibold text-[15px] hover:bg-accent transition-colors disabled:opacity-60"
        >
          {pending ? "Criando…" : "Criar parceiro + cupom"}
        </button>
      </form>

      {state && "ok" in state && (
        <div className="rounded-lg bg-card p-4 text-[14px] leading-relaxed">
          <div className="font-semibold mb-1">Criado! Manda isso pro influencer por fora do app:</div>
          <div>
            Login: <strong>{state.email}</strong>
          </div>
          <div>
            Senha temporária: <strong>{state.tempPassword}</strong>
          </div>
          <div className="text-ink-faint text-[13px] mt-1">
            Ele acessa em /entrar, e pode trocar a senha depois em &quot;Esqueci minha senha&quot;. Cupom{" "}
            <strong>{state.code}</strong> já está ativo.
          </div>
        </div>
      )}
    </div>
  );
}

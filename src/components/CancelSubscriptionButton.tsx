"use client";

import { useState, useTransition } from "react";
import { XIcon } from "@/components/icons";
import { cancelSubscription } from "@/app/actions/subscription";

export default function CancelSubscriptionButton() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await cancelSubscription();
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-on-ink-faint underline underline-offset-2"
      >
        Cancelar assinatura
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-20 bg-ink-bg/95 backdrop-blur-sm flex items-end sm:items-center justify-center p-5">
      <div className="w-full max-w-sm bg-ink-bg-2 border border-white/10 rounded-lg p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold uppercase tracking-[-0.02em] text-2xl text-on-ink">
            Cancelar assinatura
          </h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" disabled={pending}>
            <XIcon size={18} className="text-on-ink-soft" />
          </button>
        </div>

        <p className="text-on-ink-soft text-[15px]">
          Isso encerra sua assinatura agora — você perde o acesso ao plano pago na hora, e nenhuma
          cobrança futura será feita. Essa ação não tem volta; se quiser voltar depois, é só assinar de novo.
        </p>

        {error && <div className="text-sm text-accent font-medium">{error}</div>}

        <div className="flex flex-col gap-2">
          <button
            onClick={handleConfirm}
            disabled={pending}
            className="h-12 rounded bg-accent text-accent-ink font-semibold text-[15px] disabled:opacity-60"
          >
            {pending ? "Cancelando…" : "Sim, cancelar assinatura"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={pending}
            className="h-11 rounded border border-white/10 text-on-ink font-semibold text-[15px] disabled:opacity-60"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}

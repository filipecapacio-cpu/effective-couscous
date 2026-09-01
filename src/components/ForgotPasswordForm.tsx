"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/app/actions/auth";

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: Awaited<ReturnType<typeof requestPasswordReset>>, formData: FormData) =>
      requestPasswordReset(formData),
    null
  );

  if (state && "sent" in state) {
    return (
      <div className="rounded-lg bg-card p-5 text-[15px] leading-relaxed">
        Se esse e-mail tiver uma conta no Onmode, enviamos um link pra
        redefinir a senha. Confere sua caixa de entrada (e o spam).
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">E-mail</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="h-12 rounded border border-line bg-paper px-4 text-[15px] outline-none focus:border-ink"
        />
      </label>

      {state && "error" in state && (
        <div className="text-sm text-accent font-medium">{state.error}</div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-13 rounded bg-ink text-paper font-semibold text-[15px] hover:bg-accent transition-colors disabled:opacity-60"
      >
        {pending ? "Um momento…" : "Enviar link de redefinição"}
      </button>
    </form>
  );
}

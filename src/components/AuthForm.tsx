"use client";

import { useActionState } from "react";
import type { AuthResult } from "@/app/actions/auth";

type Props = {
  action: (formData: FormData) => Promise<AuthResult>;
  mode: "entrar" | "cadastro";
  goal?: string | null;
};

export default function AuthForm({ action, mode, goal }: Props) {
  const [state, formAction, pending] = useActionState<AuthResult, FormData>(
    (_prev, formData) => action(formData),
    null
  );

  if (state && "needsEmailConfirmation" in state) {
    return (
      <div className="rounded-lg bg-card p-5 text-[15px] leading-relaxed">
        Quase lá — enviamos um e-mail de confirmação. Clique no link pra
        ativar sua conta e liberar o Onmode.
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {goal && <input type="hidden" name="goal" value={goal} />}

      {mode === "cadastro" && (
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Nome</span>
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            className="h-12 rounded border border-line bg-paper px-4 text-[15px] outline-none focus:border-ink"
          />
        </label>
      )}

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

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Senha</span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === "cadastro" ? "new-password" : "current-password"}
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
        {pending ? "Um momento…" : mode === "cadastro" ? "Criar minha conta" : "Entrar"}
      </button>
    </form>
  );
}

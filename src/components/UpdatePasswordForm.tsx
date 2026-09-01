"use client";

import { useActionState } from "react";
import { updatePassword } from "@/app/actions/auth";
import type { AuthResult } from "@/app/actions/auth";

export default function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState<AuthResult, FormData>(
    (_prev, formData) => updatePassword(formData),
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Nova senha</span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          autoFocus
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
        {pending ? "Um momento…" : "Salvar nova senha"}
      </button>
    </form>
  );
}

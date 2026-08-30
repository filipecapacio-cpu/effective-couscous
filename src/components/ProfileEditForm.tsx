"use client";

import { useActionState, useState } from "react";
import { PencilIcon, XIcon } from "@/components/icons";
import { updateProfile, type UpdateProfileResult } from "@/app/actions/profile";

export default function ProfileEditForm({ name, weeklyGoal }: { name: string; weeklyGoal: number }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<UpdateProfileResult, FormData>(
    async (_prev, formData) => {
      const result = await updateProfile(formData);
      if (result && "ok" in result) setOpen(false);
      return result;
    },
    null
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Editar perfil"
        className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0"
      >
        <PencilIcon size={15} className="text-on-ink-soft" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-20 bg-ink-bg/95 backdrop-blur-sm flex items-end sm:items-center justify-center p-5">
      <form
        action={formAction}
        className="w-full max-w-sm bg-ink-bg-2 border border-white/10 rounded-lg p-6 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold uppercase tracking-[-0.02em] text-2xl text-on-ink">Editar perfil</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Fechar">
            <XIcon size={18} className="text-on-ink-soft" />
          </button>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-on-ink-soft">Nome</span>
          <input
            name="name"
            defaultValue={name}
            required
            className="h-11 rounded bg-white/5 px-3.5 text-[15px] text-on-ink outline-none border border-white/10 focus:border-white/30"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-on-ink-soft">Meta de treinos por semana</span>
          <input
            name="weeklyGoal"
            type="number"
            min={1}
            max={7}
            defaultValue={weeklyGoal}
            required
            className="h-11 rounded bg-white/5 px-3.5 text-[15px] text-on-ink outline-none border border-white/10 focus:border-white/30"
          />
        </label>

        {state && "error" in state && (
          <div className="text-sm text-accent font-medium">{state.error}</div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="h-12 rounded bg-accent text-accent-ink font-semibold text-[15px] disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
      </form>
    </div>
  );
}

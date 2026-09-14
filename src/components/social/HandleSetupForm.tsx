"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSocialProfile } from "@/app/actions/social";
import { HANDLE_PATTERN } from "@/lib/social";

/**
 * Primeiro acesso ao social: a pessoa escolhe o @ e o nome que vão aparecer
 * pros outros.
 *
 * Existe porque `posts.user_id` tem chave estrangeira pra `social_profiles`
 * — sem essa linha não dá pra publicar, curtir nem comentar. Gerar um handle
 * automático seria mais rápido, mas o @ é identidade pública e fica difícil
 * de mudar depois que outras pessoas já te conhecem por ele.
 */
export default function HandleSetupForm({
  suggestedHandle,
  suggestedName,
}: {
  suggestedHandle: string;
  suggestedName: string;
}) {
  const router = useRouter();
  const [handle, setHandle] = useState(suggestedHandle);
  const [displayName, setDisplayName] = useState(suggestedName);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleValid = HANDLE_PATTERN.test(handle);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    const formData = new FormData();
    formData.set("handle", handle);
    formData.set("displayName", displayName);

    const result = await createSocialProfile(formData);
    setBusy(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="bg-card rounded-lg p-6 flex flex-col gap-5">
      <div>
        <h2 className="font-display font-bold uppercase tracking-[-0.02em] text-[26px] leading-[1.15]">
          Escolha seu @
        </h2>
        <p className="text-[13px] text-ink-soft mt-2">
          É como os outros atletas vão te encontrar no feed. Dá pra mudar depois.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">Nome</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={40}
            required
            className="bg-card-2 rounded-lg px-3.5 py-3 text-sm outline-none focus:ring-1 focus:ring-line-strong"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">Usuário</span>
          <div className="flex items-center bg-card-2 rounded-lg pl-3.5 focus-within:ring-1 focus-within:ring-line-strong">
            <span className="text-ink-faint text-sm">@</span>
            <input
              value={handle}
              // Normaliza enquanto digita: o CHECK do banco só aceita
              // minúsculas, então é melhor a pessoa ver isso acontecendo do
              // que levar erro no envio.
              onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              maxLength={20}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
              className="flex-1 min-w-0 bg-transparent px-1 py-3 text-sm outline-none"
            />
          </div>
          {handle.length > 0 && !handleValid && (
            <span className="text-[12px] text-ink-faint">
              De 3 a 20 caracteres — letras minúsculas, números e _.
            </span>
          )}
        </label>

        {error && <p className="text-[13px] text-ink-soft">{error}</p>}

        <button
          type="submit"
          disabled={busy || !handleValid || displayName.trim().length === 0}
          className="bg-accent text-accent-ink rounded-lg py-3.5 font-display font-bold uppercase tracking-[0.01em] text-sm active:bg-accent-press disabled:opacity-40"
        >
          {busy ? "Criando…" : "Entrar no social"}
        </button>
      </form>
    </div>
  );
}

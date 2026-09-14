"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ChevronRightIcon, PeopleIcon, PencilIcon, XIcon } from "@/components/icons";
import { updateSocialProfile } from "@/app/actions/social";
import { MAX_BIO_LENGTH, type SocialAuthor } from "@/lib/social";

type Result = { error: string } | { ok: true } | null;

/**
 * Bloco do perfil público dentro da tela de Perfil.
 *
 * Existe porque a área social era alcançável só pela aba do BottomNav: não
 * havia como a pessoa ver o próprio perfil de atleta nem trocar o @ depois
 * de escolhido na primeira vez.
 *
 * Usa a paleta `on-ink` porque a tela de Perfil é a única invertida do app
 * (fundo escuro sólido) — as cores `ink`/`paper` do feed ficariam ilegíveis
 * aqui.
 */
export default function SocialProfileSection({
  profile,
  bio,
}: {
  /** null enquanto a pessoa não escolheu um @. */
  profile: SocialAuthor | null;
  bio: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<Result, FormData>(async (_prev, formData) => {
    const result = await updateSocialProfile(formData);
    if ("ok" in result) setOpen(false);
    return result;
  }, null);

  if (!profile) {
    return (
      <div className="px-5 pt-6">
        <div className="text-[13px] font-mono font-semibold text-on-ink-soft uppercase tracking-[0.06em] mb-3">
          Social
        </div>
        <Link
          href="/social"
          className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10"
        >
          <PeopleIcon size={18} className="text-accent flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold">Entrar no social</div>
            <div className="text-[12.5px] text-on-ink-soft mt-0.5">
              Escolha seu @ pra publicar treinos e aparecer no feed.
            </div>
          </div>
          <ChevronRightIcon size={16} className="text-on-ink-faint flex-shrink-0" />
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6">
      <div className="text-[13px] font-mono font-semibold text-on-ink-soft uppercase tracking-[0.06em] mb-3">
        Social
      </div>

      <div className="rounded-lg bg-white/5 border border-white/10 overflow-hidden">
        <Link href={`/atleta/${profile.handle}`} className="flex items-center gap-3 p-4">
          <PeopleIcon size={18} className="text-accent flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold truncate">Meu perfil público</div>
            <div className="text-[12.5px] text-on-ink-soft mt-0.5 truncate">@{profile.handle}</div>
          </div>
          <ChevronRightIcon size={16} className="text-on-ink-faint flex-shrink-0" />
        </Link>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 p-4 border-t border-white/10 text-left"
        >
          <PencilIcon size={16} className="text-on-ink-soft flex-shrink-0" />
          <span className="flex-1 text-[14px]">Editar @, nome e bio</span>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-20 bg-ink-bg/95 backdrop-blur-sm flex items-end sm:items-center justify-center p-5">
          <form
            action={formAction}
            className="w-full max-w-sm bg-ink-bg-2 border border-white/10 rounded-lg p-6 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold uppercase tracking-[-0.02em] text-2xl text-on-ink">
                Perfil público
              </h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar">
                <XIcon size={18} className="text-on-ink-soft" />
              </button>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-on-ink-soft">Nome</span>
              <input
                name="displayName"
                defaultValue={profile.display_name}
                maxLength={40}
                required
                className="h-11 rounded bg-white/5 px-3.5 text-[15px] text-on-ink outline-none border border-white/10 focus:border-white/30"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-on-ink-soft">Usuário</span>
              <input
                name="handle"
                defaultValue={profile.handle}
                maxLength={20}
                pattern="[a-zA-Z0-9_]{3,20}"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
                className="h-11 rounded bg-white/5 px-3.5 text-[15px] text-on-ink outline-none border border-white/10 focus:border-white/30"
              />
              <span className="text-[12px] text-on-ink-faint">
                Trocar o @ muda o endereço do seu perfil — links antigos param de funcionar.
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-on-ink-soft">Bio</span>
              <textarea
                name="bio"
                defaultValue={bio ?? ""}
                maxLength={MAX_BIO_LENGTH}
                rows={3}
                className="rounded bg-white/5 px-3.5 py-2.5 text-[15px] text-on-ink outline-none border border-white/10 focus:border-white/30 resize-none"
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
      )}
    </div>
  );
}

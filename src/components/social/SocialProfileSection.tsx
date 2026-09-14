"use client";

import { useActionState, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ChevronRightIcon,
  InstagramIcon,
  PeopleIcon,
  PencilIcon,
  TikTokIcon,
  XIcon,
} from "@/components/icons";
import { updateSocialProfile } from "@/app/actions/social";
import { MAX_BIO_LENGTH, type SocialAuthor } from "@/lib/social";

type Result = { error: string } | { ok: true } | null;

/**
 * Uma linha de rede social no card do Perfil. Mostra o @ já preenchido ou o
 * convite pra adicionar — nos dois casos leva pro mesmo modal de edição.
 */
function NetworkRow({
  icon,
  label,
  value,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={value ? `Editar ${label}: @${value}` : `Adicionar seu @ do ${label}`}
      className="w-full flex items-center gap-3 p-4 border-t border-white/10 text-left"
    >
      {icon}
      <span className="text-[14px] flex-shrink-0">{label}</span>
      <span
        className={`flex-1 text-right text-[13px] truncate ${
          value ? "text-on-ink-soft" : "text-accent"
        }`}
      >
        {value ? `@${value}` : "Adicionar"}
      </span>
      <ChevronRightIcon size={15} className="text-on-ink-faint flex-shrink-0" />
    </button>
  );
}

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
  instagram,
  tiktok,
}: {
  /** null enquanto a pessoa não escolheu um @. */
  profile: SocialAuthor | null;
  bio: string | null;
  instagram: string | null;
  tiktok: string | null;
}) {
  const [open, setOpen] = useState(false);
  // Qual campo recebe o foco ao abrir o modal. Clicar na linha do
  // Instagram e cair com o cursor no campo Nome seria frustrante.
  const [focusField, setFocusField] = useState<"instagram" | "tiktok" | null>(null);

  function openModal(field: "instagram" | "tiktok" | null = null) {
    setFocusField(field);
    setOpen(true);
  }

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

        {/*
          As redes ficam visíveis aqui fora, e não só dentro do modal: o
          ícone é o que sinaliza que dá pra adicionar. Enterrado atrás de
          "Editar @, nome e bio", ninguém descobria que isso existia.
        */}
        <NetworkRow
          icon={<InstagramIcon size={17} className="text-on-ink-soft flex-shrink-0" />}
          label="Instagram"
          value={instagram}
          onClick={() => openModal("instagram")}
        />
        <NetworkRow
          icon={<TikTokIcon size={17} className="text-on-ink-soft flex-shrink-0" />}
          label="TikTok"
          value={tiktok}
          onClick={() => openModal("tiktok")}
        />

        <button
          type="button"
          onClick={() => openModal()}
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

            {/*
              Só o @, nunca a URL — a URL é montada na hora de renderizar o
              link no perfil público. Colar o endereço inteiro funciona
              mesmo assim: a action normaliza antes de validar.
            */}
            <div className="flex flex-col gap-3">
              <span className="text-sm text-on-ink-soft">Suas redes (opcional)</span>

              <label className="flex items-center gap-2.5 h-11 rounded bg-white/5 px-3.5 border border-white/10 focus-within:border-white/30">
                <InstagramIcon size={17} className="text-on-ink-faint flex-shrink-0" />
                <span className="text-on-ink-faint text-[15px]">@</span>
                <input
                  name="instagram"
                  autoFocus={focusField === "instagram"}
                  defaultValue={instagram ?? ""}
                  maxLength={60}
                  placeholder="seu.perfil"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label="@ do Instagram"
                  className="flex-1 min-w-0 bg-transparent text-[15px] text-on-ink outline-none placeholder:text-on-ink-faint"
                />
              </label>

              <label className="flex items-center gap-2.5 h-11 rounded bg-white/5 px-3.5 border border-white/10 focus-within:border-white/30">
                <TikTokIcon size={17} className="text-on-ink-faint flex-shrink-0" />
                <span className="text-on-ink-faint text-[15px]">@</span>
                <input
                  name="tiktok"
                  autoFocus={focusField === "tiktok"}
                  defaultValue={tiktok ?? ""}
                  maxLength={60}
                  placeholder="seu.perfil"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  aria-label="@ do TikTok"
                  className="flex-1 min-w-0 bg-transparent text-[15px] text-on-ink outline-none placeholder:text-on-ink-faint"
                />
              </label>
            </div>

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

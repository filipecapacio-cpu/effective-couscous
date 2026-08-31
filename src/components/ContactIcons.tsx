"use client";

import { useState } from "react";
import { InstagramIcon, MailIcon } from "@/components/icons";

const EMAIL = "suporteonmode@gmail.com";
const INSTAGRAM_URL = "https://instagram.com/useonmode";

export default function ContactIcons() {
  const [copied, setCopied] = useState(false);

  async function handleMailClick() {
    // O link mailto ainda tenta abrir o app de e-mail normalmente.
    // Isso aqui é só um reforço pra quem não tem nenhum app de e-mail
    // configurado no aparelho - sem isso, o toque não faz nada visível.
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2800);
    } catch {
      // clipboard indisponível (ex: contexto sem permissão) - sem problema,
      // o link mailto ainda funciona normalmente pra quem tem app de e-mail.
    }
  }

  return (
    <div className="relative flex items-center gap-2.5 mt-1">
      <a
        href={`mailto:${EMAIL}`}
        onClick={handleMailClick}
        aria-label="Enviar e-mail pra Onmode"
        title={EMAIL}
        className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        <MailIcon size={16} className="text-on-ink" />
      </a>
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Onmode no Instagram"
        title="@useonmode"
        className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        <InstagramIcon size={16} className="text-on-ink" />
      </a>
      {copied && (
        <span className="absolute left-0 -bottom-6 text-xs text-on-ink-soft whitespace-nowrap">
          E-mail copiado: {EMAIL}
        </span>
      )}
    </div>
  );
}

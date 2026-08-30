"use client";

import { useState } from "react";
import { ShareIcon } from "@/components/icons";

export default function ShareSummaryButton({ text, disabled }: { text: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text, title: "Onmode" });
        return;
      } catch {
        // usuário cancelou o compartilhamento — sem problema.
        return;
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className="w-full h-13 rounded bg-accent text-accent-ink flex items-center justify-center gap-2.5 font-semibold text-[15px] disabled:opacity-40"
    >
      <ShareIcon size={17} />
      {copied ? "Copiado!" : "Compartilhar resumo"}
    </button>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

/**
 * Rede de segurança genérica pra qualquer erro não tratado em qualquer
 * página do app (precisa ser client component + "use client", convenção do
 * Next.js). Sem isso, um erro inesperado em qualquer lugar caía na tela
 * padrão feia do framework em vez de algo consistente com o resto do app.
 */
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[ErrorBoundary]", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-md min-h-svh flex flex-col items-center justify-center gap-5 px-6 text-center">
      <Logo className="text-2xl" />
      <h1 className="font-display font-bold uppercase tracking-[-0.02em] text-4xl">Algo saiu do ritmo.</h1>
      <p className="text-ink-soft text-[15px]">
        Alguma coisa deu errado por aqui. Tenta de novo — se continuar acontecendo, fala com a
        gente em suporteonmode@gmail.com.
      </p>
      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={() => reset()}
          className="h-12 px-6 inline-flex items-center justify-center rounded bg-ink text-paper font-semibold text-[15px] hover:bg-accent transition-colors"
        >
          Tentar de novo
        </button>
        <Link
          href="/"
          className="h-12 px-6 inline-flex items-center justify-center rounded border border-line font-semibold text-[15px] hover:border-ink transition-colors"
        >
          Início
        </Link>
      </div>
    </div>
  );
}

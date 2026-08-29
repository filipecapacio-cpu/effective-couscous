import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-md min-h-svh flex flex-col items-center justify-center gap-5 px-6 text-center">
      <Logo className="text-2xl" />
      <h1 className="font-bold uppercase tracking-[-0.02em] text-4xl">Página fora do ritmo.</h1>
      <p className="text-ink-soft text-[15px]">Essa página não existe ou foi movida.</p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center justify-center h-12 px-6 rounded-full bg-ink text-paper font-semibold text-[15px] hover:bg-accent transition-colors"
      >
        Voltar pro início
      </Link>
    </div>
  );
}

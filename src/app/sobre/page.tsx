import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function SobrePage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16 flex flex-col gap-8 min-h-svh">
      <Link href="/">
        <Logo className="text-2xl" />
      </Link>

      <div className="flex flex-col gap-6">
        <h1 className="font-display font-bold uppercase tracking-[-0.02em] text-4xl md:text-5xl leading-[1.05]">
          Sobre a Onmode
        </h1>

        <div className="flex flex-col gap-5 text-[17px] leading-relaxed text-ink-soft">
          <p>
            A Onmode nasceu de um problema simples: treino, nutrição e sono
            sempre pareciam brigar com aula, trabalho e prazo. Em vez de
            criar mais um app de academia, a gente resolveu criar um método
            que se adapta à sua rotina — não o contrário.
          </p>
          <p>
            Aqui você registra o treino do dia, acompanha sua recuperação e
            mantém a constância sem precisar virar especialista em fitness.
            Sem crachá, sem postura de influencer, sem enrolação.
          </p>
          <p>
            Performance discreta, pensada pra quem também vive de agenda
            cheia.
          </p>
        </div>
      </div>

      <Link
        href="/onboarding"
        className="self-start inline-flex items-center justify-center h-12 px-7 rounded bg-ink text-paper font-semibold text-[15px] hover:bg-accent transition-colors mt-2"
      >
        Comece seu ritmo
      </Link>
    </div>
  );
}

import type { Metadata } from "next";
import { connection } from "next/server";
import LeitorConversaClient from "@/components/LeitorConversaClient";
import { isAnthropicConfigured } from "@/lib/anthropic";

/** A análise é síncrona: a tela espera a resposta da IA chegar. */
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Leitor de Conversa — entenda o tom de um papo",
  description:
    "Mande prints de uma conversa e receba uma leitura dos sinais: como está o clima, o que pode estar atrapalhando e que direções fazem sentido pra próxima mensagem.",
};

export default async function LeitorDeConversaPage() {
  // Sem isso a página seria prerenderizada e a leitura da ANTHROPIC_API_KEY
  // ficaria congelada no build - o aviso de "não configurado" continuaria
  // aparecendo mesmo depois de a chave existir no ambiente.
  await connection();

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-5 py-10 sm:py-16">
      <header className="flex flex-col gap-3">
        <h1 className="font-display text-3xl font-bold uppercase leading-[1.05] tracking-[-0.02em] sm:text-4xl">
          Leitor de Conversa
        </h1>
        <p className="text-[17px] leading-relaxed text-ink-soft">
          Manda os prints de uma conversa e a IA lê o tom: como está o clima, o que pode estar
          atrapalhando do seu lado e que caminhos fazem sentido pra próxima mensagem. Sem frase
          pronta — a ideia é você entender os sinais e escrever do seu jeito.
        </p>
      </header>

      <LeitorConversaClient iaConfigurada={isAnthropicConfigured()} />
    </div>
  );
}

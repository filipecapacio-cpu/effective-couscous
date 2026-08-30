"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackArrowIcon, ClipboardIcon, DumbbellIcon, TargetIcon, TrendIcon } from "@/components/icons";

type Goal = "performance" | "emagrecimento" | "massa" | "habito";

const options: { id: Goal; title: string; subtitle: string; Icon: typeof TargetIcon }[] = [
  { id: "performance", title: "Performance esportiva", subtitle: "Correr, nadar, jogar melhor", Icon: TargetIcon },
  { id: "emagrecimento", title: "Emagrecimento", subtitle: "Perder gordura com consistência", Icon: TrendIcon },
  { id: "massa", title: "Ganho de massa", subtitle: "Treino de força e superávit", Icon: DumbbellIcon },
  { id: "habito", title: "Consistência / hábito", subtitle: "Criar rotina antes de tudo", Icon: ClipboardIcon },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [picked, setPicked] = useState<Goal>("performance");

  return (
    <div className="mx-auto w-full max-w-[420px] min-h-svh flex flex-col">
      <div className="px-6 pt-6 pb-2 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} aria-label="Voltar" className="text-ink">
            <BackArrowIcon size={22} />
          </button>
          <div className="text-[13px] text-ink-soft">2 de 5</div>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= 1 ? "bg-ink" : "bg-line"}`}
            />
          ))}
        </div>
      </div>

      <div className="px-6 pt-7 pb-1">
        <h1 className="font-display font-bold uppercase tracking-[-0.02em] text-3xl leading-tight">Qual é o seu foco principal agora?</h1>
        <p className="text-sm text-ink-soft mt-2.5">Você pode ajustar isso quando quiser.</p>
      </div>

      <div className="px-6 py-6 flex flex-col gap-3 flex-1">
        {options.map(({ id, title, subtitle, Icon }) => {
          const selected = picked === id;
          return (
            <button
              key={id}
              onClick={() => setPicked(id)}
              className={`flex items-center gap-4 p-4.5 rounded-lg border-[1.5px] text-left transition-colors ${
                selected ? "border-accent bg-accent-soft" : "border-line bg-paper hover:border-ink-faint"
              }`}
            >
              <div
                className={`w-10.5 h-10.5 rounded flex items-center justify-center flex-shrink-0 ${
                  selected ? "bg-accent text-accent-ink" : "bg-card text-ink"
                }`}
              >
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <div className="text-[15.5px] font-semibold">{title}</div>
                <div className="text-[13px] text-ink-soft mt-0.5">{subtitle}</div>
              </div>
              <div
                className={`w-5.5 h-5.5 rounded-full border-[1.5px] flex-shrink-0 ${
                  selected ? "border-accent bg-accent" : "border-line bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="px-6 pb-8 pt-2">
        <button
          onClick={() => router.push(`/cadastro?goal=${picked}`)}
          className="w-full h-13 rounded bg-ink text-paper font-semibold text-[15px] hover:bg-accent transition-colors"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}

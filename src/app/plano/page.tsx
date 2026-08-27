"use client";

import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import { CheckIcon, ClockIcon } from "@/components/icons";

const treino = [
  { name: "Supino reto", detail: "4 séries · 8-10 reps", done: true },
  { name: "Puxada frontal", detail: "4 séries · 10-12 reps", done: true },
  { name: "Desenvolvimento com halteres", detail: "3 séries · 10 reps", done: false },
  { name: "Rosca direta", detail: "3 séries · 12 reps", done: false },
];

const dieta = [
  { name: "Café da manhã", detail: "Ovos, aveia, fruta", kcal: "420 kcal", done: true },
  { name: "Almoço", detail: "Frango, arroz, salada", kcal: "680 kcal", done: true },
  { name: "Lanche da tarde", detail: "Iogurte, castanhas", kcal: "240 kcal", done: false },
  { name: "Jantar", detail: "Peixe, legumes", kcal: "610 kcal", done: false },
];

export default function PlanoPage() {
  const [tab, setTab] = useState<"treino" | "dieta">("treino");

  return (
    <div className="mx-auto w-full max-w-[420px] min-h-svh flex flex-col">
      <header className="px-6 pt-6 pb-1">
        <div className="text-[13px] text-ink-soft">Hoje, sexta</div>
        <h1 className="font-serif italic text-[28px] mt-1">Seu plano do dia</h1>
      </header>

      <div className="px-6 pt-4.5">
        <div className="flex bg-card rounded-full p-1">
          <button
            onClick={() => setTab("treino")}
            className={`flex-1 text-center py-2.5 rounded-full text-sm font-semibold transition-colors ${
              tab === "treino" ? "bg-ink text-paper" : "text-ink-soft"
            }`}
          >
            Treino
          </button>
          <button
            onClick={() => setTab("dieta")}
            className={`flex-1 text-center py-2.5 rounded-full text-sm font-semibold transition-colors ${
              tab === "dieta" ? "bg-ink text-paper" : "text-ink-soft"
            }`}
          >
            Dieta
          </button>
        </div>
      </div>

      <main className="flex-1 px-6 py-5">
        {tab === "treino" ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-sm text-ink-soft">Upper Body · Força</span>
              <span className="text-sm text-ink-soft">45 min</span>
            </div>
            {treino.map((item) => (
              <div
                key={item.name}
                className={`flex items-center gap-3.5 p-3.5 rounded-2xl ${
                  item.done ? "bg-card" : "bg-paper border-[1.5px] border-line"
                }`}
              >
                <div
                  className={`w-6.5 h-6.5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.done ? "bg-accent" : "border-[1.5px] border-line"
                  }`}
                >
                  {item.done && <CheckIcon size={14} className="text-accent-ink" />}
                </div>
                <div className="flex-1">
                  <div className="text-[15px] font-semibold">{item.name}</div>
                  <div className="text-[13px] text-ink-soft mt-0.5">{item.detail}</div>
                </div>
                {!item.done && <ClockIcon size={17} className="text-ink-faint" />}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-sm text-ink-soft">Meta do dia</span>
              <span className="text-sm text-ink-soft">1 950 kcal</span>
            </div>
            {dieta.map((item) => (
              <div
                key={item.name}
                className={`flex items-center gap-3.5 p-3.5 rounded-2xl ${
                  item.done ? "bg-card" : "bg-paper border-[1.5px] border-dashed border-line"
                }`}
              >
                <div
                  className={`w-6.5 h-6.5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.done ? "bg-accent" : "border-[1.5px] border-line"
                  }`}
                >
                  {item.done && <CheckIcon size={14} className="text-accent-ink" />}
                </div>
                <div className="flex-1">
                  <div className={`text-[15px] font-semibold ${!item.done && "text-ink-soft"}`}>{item.name}</div>
                  <div className="text-[13px] text-ink-faint mt-0.5">{item.detail}</div>
                </div>
                <span className="text-[13px] text-ink-faint">{item.kcal}</span>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

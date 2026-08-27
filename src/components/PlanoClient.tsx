"use client";

import { useState, useTransition } from "react";
import { CheckIcon, ClockIcon } from "@/components/icons";
import { toggleExercise, toggleMeal } from "@/app/actions/plan";

type Exercise = { id: string; name: string; detail: string | null; done: boolean };
type Meal = { id: string; name: string; detail: string | null; kcal: number | null; done: boolean };

type Props = {
  workoutTitle: string;
  durationMin: number | null;
  exercises: Exercise[];
  meals: Meal[];
};

export default function PlanoClient({ workoutTitle, durationMin, exercises, meals }: Props) {
  const [tab, setTab] = useState<"treino" | "dieta">("treino");
  const [, startTransition] = useTransition();

  const totalKcal = meals.reduce((sum, m) => sum + (m.kcal ?? 0), 0);

  return (
    <>
      <header className="px-6 pt-6 pb-1">
        <div className="text-[13px] text-ink-soft">Hoje</div>
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
              <span className="text-sm text-ink-soft">{workoutTitle}</span>
              {durationMin && <span className="text-sm text-ink-soft">{durationMin} min</span>}
            </div>
            {exercises.length === 0 && (
              <p className="text-sm text-ink-soft">Nenhum exercício hoje.</p>
            )}
            {exercises.map((item) => (
              <button
                key={item.id}
                onClick={() => startTransition(() => toggleExercise(item.id, !item.done))}
                className={`flex items-center gap-3.5 p-3.5 rounded-2xl text-left w-full ${
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
                  {item.detail && <div className="text-[13px] text-ink-soft mt-0.5">{item.detail}</div>}
                </div>
                {!item.done && <ClockIcon size={17} className="text-ink-faint" />}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-sm text-ink-soft">Refeições de hoje</span>
              {totalKcal > 0 && <span className="text-sm text-ink-soft">{totalKcal} kcal</span>}
            </div>
            {meals.map((item) => (
              <button
                key={item.id}
                onClick={() => startTransition(() => toggleMeal(item.id, !item.done))}
                className={`flex items-center gap-3.5 p-3.5 rounded-2xl text-left w-full ${
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
                  <div className={`text-[15px] font-semibold ${!item.done && "text-ink-soft"}`}>
                    {item.name}
                  </div>
                  {item.detail && (
                    <div className="text-[13px] text-ink-faint mt-0.5">{item.detail}</div>
                  )}
                </div>
                {item.kcal && <span className="text-[13px] text-ink-faint">{item.kcal} kcal</span>}
              </button>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

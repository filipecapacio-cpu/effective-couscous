"use client";

import { useState, useTransition } from "react";
import { CheckIcon, PencilIcon, PlusIcon, TrashIcon, XIcon } from "@/components/icons";
import {
  addExercise,
  addMeal,
  deleteExercise,
  deleteMeal,
  toggleExercise,
  toggleMeal,
  updateExercise,
  updateMeal,
} from "@/app/actions/plan";

type Exercise = { id: string; name: string; detail: string | null; done: boolean };
type Meal = { id: string; name: string; detail: string | null; kcal: number | null; done: boolean };

type Props = {
  workoutId: string | null;
  userId: string;
  workoutTitle: string;
  durationMin: number | null;
  exercises: Exercise[];
  meals: Meal[];
};

export default function PlanoClient({
  workoutId,
  userId,
  workoutTitle,
  durationMin,
  exercises,
  meals,
}: Props) {
  const [tab, setTab] = useState<"treino" | "dieta">("treino");
  const [, startTransition] = useTransition();
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [editingMeal, setEditingMeal] = useState<string | null>(null);
  const [addingExercise, setAddingExercise] = useState(false);
  const [addingMeal, setAddingMeal] = useState(false);

  const totalKcal = meals.reduce((sum, m) => sum + (m.kcal ?? 0), 0);

  return (
    <>
      <header className="px-6 pt-6 pb-1">
        <div className="text-[13px] text-ink-soft">Hoje</div>
        <h1 className="font-bold uppercase tracking-[-0.02em] text-[28px] mt-1">Seu plano do dia</h1>
      </header>

      <div className="px-6 pt-4.5">
        <div className="flex bg-card rounded-full p-1">
          <button
            onClick={() => setTab("treino")}
            className={`flex-1 text-center py-2.5 rounded-full text-sm font-semibold transition-colors ${
              tab === "treino" ? "bg-accent text-accent-ink" : "text-ink-soft"
            }`}
          >
            Treino
          </button>
          <button
            onClick={() => setTab("dieta")}
            className={`flex-1 text-center py-2.5 rounded-full text-sm font-semibold transition-colors ${
              tab === "dieta" ? "bg-accent text-accent-ink" : "text-ink-soft"
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

            {exercises.length === 0 && !addingExercise && (
              <p className="text-sm text-ink-soft">Nenhum exercício hoje.</p>
            )}

            {exercises.map((item) =>
              editingExercise === item.id ? (
                <ExerciseForm
                  key={item.id}
                  initial={item}
                  onCancel={() => setEditingExercise(null)}
                  onSave={(name, detail) => {
                    startTransition(() => updateExercise(item.id, name, detail));
                    setEditingExercise(null);
                  }}
                />
              ) : (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl ${
                    item.done ? "bg-card" : "bg-paper border-[1.5px] border-line"
                  }`}
                >
                  <button
                    onClick={() => startTransition(() => toggleExercise(item.id, !item.done))}
                    className={`w-6.5 h-6.5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.done ? "bg-accent" : "border-[1.5px] border-line"
                    }`}
                  >
                    {item.done && <CheckIcon size={14} className="text-accent-ink" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold truncate">{item.name}</div>
                    {item.detail && <div className="text-[13px] text-ink-soft mt-0.5 truncate">{item.detail}</div>}
                  </div>
                  <button
                    onClick={() => setEditingExercise(item.id)}
                    aria-label="Editar"
                    className="text-ink-faint flex-shrink-0"
                  >
                    <PencilIcon size={16} />
                  </button>
                  <button
                    onClick={() => startTransition(() => deleteExercise(item.id))}
                    aria-label="Remover"
                    className="text-ink-faint flex-shrink-0"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              )
            )}

            {addingExercise ? (
              <ExerciseForm
                onCancel={() => setAddingExercise(false)}
                onSave={(name, detail) => {
                  if (workoutId) startTransition(() => addExercise(workoutId, name, detail));
                  setAddingExercise(false);
                }}
              />
            ) : (
              <button
                onClick={() => setAddingExercise(true)}
                disabled={!workoutId}
                className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border-[1.5px] border-dashed border-line text-ink-soft text-sm font-semibold disabled:opacity-40"
              >
                <PlusIcon size={16} />
                Adicionar exercício
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-sm text-ink-soft">Refeições de hoje</span>
              {totalKcal > 0 && <span className="text-sm text-ink-soft">{totalKcal} kcal</span>}
            </div>

            {meals.map((item) =>
              editingMeal === item.id ? (
                <MealForm
                  key={item.id}
                  initial={item}
                  onCancel={() => setEditingMeal(null)}
                  onSave={(name, detail, kcal) => {
                    startTransition(() => updateMeal(item.id, name, detail, kcal));
                    setEditingMeal(null);
                  }}
                />
              ) : (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl ${
                    item.done ? "bg-card" : "bg-paper border-[1.5px] border-dashed border-line"
                  }`}
                >
                  <button
                    onClick={() => startTransition(() => toggleMeal(item.id, !item.done))}
                    className={`w-6.5 h-6.5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.done ? "bg-accent" : "border-[1.5px] border-line"
                    }`}
                  >
                    {item.done && <CheckIcon size={14} className="text-accent-ink" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-[15px] font-semibold truncate ${!item.done && "text-ink-soft"}`}>
                      {item.name}
                    </div>
                    {item.detail && (
                      <div className="text-[13px] text-ink-faint mt-0.5 truncate">{item.detail}</div>
                    )}
                  </div>
                  {item.kcal ? <span className="text-[13px] text-ink-faint flex-shrink-0">{item.kcal} kcal</span> : null}
                  <button
                    onClick={() => setEditingMeal(item.id)}
                    aria-label="Editar"
                    className="text-ink-faint flex-shrink-0"
                  >
                    <PencilIcon size={16} />
                  </button>
                  <button
                    onClick={() => startTransition(() => deleteMeal(item.id))}
                    aria-label="Remover"
                    className="text-ink-faint flex-shrink-0"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              )
            )}

            {addingMeal ? (
              <MealForm
                onCancel={() => setAddingMeal(false)}
                onSave={(name, detail, kcal) => {
                  startTransition(() => addMeal(userId, name, detail, kcal));
                  setAddingMeal(false);
                }}
              />
            ) : (
              <button
                onClick={() => setAddingMeal(true)}
                className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border-[1.5px] border-dashed border-line text-ink-soft text-sm font-semibold"
              >
                <PlusIcon size={16} />
                Adicionar refeição
              </button>
            )}
          </div>
        )}
      </main>
    </>
  );
}

function ExerciseForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: { name: string; detail: string | null };
  onSave: (name: string, detail: string | null) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [detail, setDetail] = useState(initial?.detail ?? "");

  return (
    <div className="flex flex-col gap-2 p-3.5 rounded-2xl border-[1.5px] border-ink">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do exercício"
        className="h-10 rounded-lg bg-paper px-3 text-[15px] font-semibold outline-none"
      />
      <input
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        placeholder="Séries · reps (opcional)"
        className="h-9 rounded-lg bg-paper px-3 text-[13px] text-ink-soft outline-none"
      />
      <div className="flex gap-2 mt-1">
        <button
          onClick={() => name.trim() && onSave(name.trim(), detail.trim() || null)}
          className="flex-1 h-9 rounded-full bg-ink text-paper text-sm font-semibold"
        >
          Salvar
        </button>
        <button onClick={onCancel} className="w-9 h-9 rounded-full bg-card flex items-center justify-center flex-shrink-0">
          <XIcon size={16} className="text-ink-soft" />
        </button>
      </div>
    </div>
  );
}

function MealForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: { name: string; detail: string | null; kcal: number | null };
  onSave: (name: string, detail: string | null, kcal: number | null) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [detail, setDetail] = useState(initial?.detail ?? "");
  const [kcal, setKcal] = useState(initial?.kcal ? String(initial.kcal) : "");

  return (
    <div className="flex flex-col gap-2 p-3.5 rounded-2xl border-[1.5px] border-ink">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome da refeição"
        className="h-10 rounded-lg bg-paper px-3 text-[15px] font-semibold outline-none"
      />
      <input
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        placeholder="O que vai comer (opcional)"
        className="h-9 rounded-lg bg-paper px-3 text-[13px] text-ink-soft outline-none"
      />
      <input
        value={kcal}
        onChange={(e) => setKcal(e.target.value.replace(/\D/g, ""))}
        inputMode="numeric"
        placeholder="Kcal (opcional)"
        className="h-9 rounded-lg bg-paper px-3 text-[13px] text-ink-soft outline-none"
      />
      <div className="flex gap-2 mt-1">
        <button
          onClick={() => name.trim() && onSave(name.trim(), detail.trim() || null, kcal ? Number(kcal) : null)}
          className="flex-1 h-9 rounded-full bg-ink text-paper text-sm font-semibold"
        >
          Salvar
        </button>
        <button onClick={onCancel} className="w-9 h-9 rounded-full bg-card flex items-center justify-center flex-shrink-0">
          <XIcon size={16} className="text-ink-soft" />
        </button>
      </div>
    </div>
  );
}

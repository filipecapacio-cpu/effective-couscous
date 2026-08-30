"use client";

import { useActionState, useState, useTransition } from "react";
import { CheckIcon, PencilIcon, PlusIcon, SparkleIcon, TrashIcon, XIcon } from "@/components/icons";
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
import { saveWorkoutLog } from "@/app/actions/workoutLog";
import {
  INTENSITY_LABELS,
  WORKOUT_MODALITIES,
  type IntensityLabel,
  type WorkoutLog,
  type WorkoutLogResult,
  type WorkoutModality,
} from "@/lib/workoutLog";
import { Logo } from "@/components/Logo";
import ShareSummaryButton from "@/components/ShareSummaryButton";

type Exercise = { id: string; name: string; detail: string | null; done: boolean };
type Meal = { id: string; name: string; detail: string | null; kcal: number | null; done: boolean };

type Props = {
  workoutId: string | null;
  userId: string;
  workoutTitle: string;
  durationMin: number | null;
  exercises: Exercise[];
  meals: Meal[];
  initialWorkoutLog: WorkoutLog | null;
  aiPlanSummary: string | null;
  aiPlanGeneratedAt: string | null;
};

const AI_PLAN_DATE_FMT = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

export default function PlanoClient({
  workoutId,
  userId,
  workoutTitle,
  durationMin,
  exercises,
  meals,
  initialWorkoutLog,
  aiPlanSummary,
  aiPlanGeneratedAt,
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
        <h1 className="font-display font-bold uppercase tracking-[-0.02em] text-[28px] mt-1">Seu plano do dia</h1>
      </header>

      {aiPlanGeneratedAt && (
        <div className="mx-6 mt-4 flex items-start gap-3 p-4 rounded-lg bg-card border border-accent">
          <SparkleIcon size={18} className="text-accent flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold">Plano gerado por IA</div>
            {aiPlanSummary && <div className="text-[12.5px] text-ink-soft mt-0.5">{aiPlanSummary}</div>}
            <div className="text-[11px] font-mono uppercase tracking-[0.06em] text-ink-faint mt-1.5">
              Gerado em {AI_PLAN_DATE_FMT.format(new Date(aiPlanGeneratedAt))}
            </div>
          </div>
        </div>
      )}

      <div className="px-6 pt-4.5">
        <div className="flex bg-card rounded p-1">
          <button
            onClick={() => setTab("treino")}
            className={`flex-1 text-center py-2.5 rounded text-sm font-semibold transition-colors ${
              tab === "treino" ? "bg-accent text-accent-ink" : "text-ink-soft"
            }`}
          >
            Treino
          </button>
          <button
            onClick={() => setTab("dieta")}
            className={`flex-1 text-center py-2.5 rounded text-sm font-semibold transition-colors ${
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
            <WorkoutLogForm userId={userId} initial={initialWorkoutLog} />

            <div className="flex items-center justify-between mb-0.5 mt-1">
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
                  className={`flex items-center gap-3 p-3.5 rounded-lg ${
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
                className="flex items-center justify-center gap-2 p-3.5 rounded-lg border-[1.5px] border-dashed border-line text-ink-soft text-sm font-semibold disabled:opacity-40"
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
                  className={`flex items-center gap-3 p-3.5 rounded-lg ${
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
                className="flex items-center justify-center gap-2 p-3.5 rounded-lg border-[1.5px] border-dashed border-line text-ink-soft text-sm font-semibold"
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
    <div className="flex flex-col gap-2 p-3.5 rounded-lg border-[1.5px] border-ink">
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
          className="flex-1 h-9 rounded bg-ink text-paper text-sm font-semibold"
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
    <div className="flex flex-col gap-2 p-3.5 rounded-lg border-[1.5px] border-ink">
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
          className="flex-1 h-9 rounded bg-ink text-paper text-sm font-semibold"
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

const logInputClass = "h-11 rounded border border-line bg-paper px-3.5 text-[15px] outline-none focus:border-ink";
const logLabelClass = "flex flex-col gap-1.5";
const logCaptionClass = "text-sm font-medium";

function WorkoutLogForm({ userId, initial }: { userId: string; initial: WorkoutLog | null }) {
  const [modality, setModality] = useState<WorkoutModality>(initial?.modality ?? "Musculação");
  const [intensityLabel, setIntensityLabel] = useState<IntensityLabel | null>(
    initial?.intensityLabel ?? null
  );
  const [intensityScore, setIntensityScore] = useState(
    initial?.intensityScore ? String(initial.intensityScore) : ""
  );
  const [durationMin, setDurationMin] = useState(initial?.durationMin ? String(initial.durationMin) : "");
  const [done, setDone] = useState(Boolean(initial));
  const isRest = modality === "Descanso";

  const [state, formAction, pending] = useActionState<WorkoutLogResult | null, FormData>(
    async (_prev, formData) => {
      const result = await saveWorkoutLog(formData);
      if (result && "ok" in result) setDone(true);
      return result;
    },
    null
  );

  if (done) {
    const parts: string[] = [modality];
    if (!isRest) {
      if (intensityLabel) parts.push(intensityScore ? `${intensityLabel} ${intensityScore}/10` : intensityLabel);
      if (durationMin) parts.push(`${durationMin} min`);
    }

    return (
      <div className="flex flex-col items-center gap-4 p-7 rounded-lg bg-card border-[1.5px] border-accent text-center mt-1">
        <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
          <CheckIcon size={30} strokeWidth={3.5} className="text-accent-ink" />
        </div>
        <div>
          <div className="font-display font-bold uppercase tracking-[-0.02em] text-2xl">
            Treino de hoje registrado
          </div>
          <div className="text-sm text-ink-soft mt-1.5">{parts.join(" · ")}</div>
        </div>

        <div className="w-full flex flex-col gap-2.5 mt-2">
          <ShareSummaryButton
            text={`Treinei hoje: ${parts.join(" · ")} 💪 via Onmode`}
          />
          <button
            type="button"
            onClick={() => setDone(false)}
            className="h-10 rounded text-sm font-semibold text-ink-soft"
          >
            Editar registro
          </button>
        </div>

        <Logo size={14} className="text-[13px] text-ink-faint mt-1" />
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 p-3.5 rounded-lg border-[1.5px] border-line mt-1">
      <input type="hidden" name="userId" value={userId} />
      <span className="text-sm font-semibold">Registrar treino de hoje</span>

      <label className={logLabelClass}>
        <span className={logCaptionClass}>Modalidade</span>
        <select
          name="modality"
          value={modality}
          onChange={(e) => setModality(e.target.value as WorkoutModality)}
          className={logInputClass}
        >
          {WORKOUT_MODALITIES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </label>

      {!isRest && (
        <>
          <div className={logLabelClass}>
            <span className={logCaptionClass}>Intensidade</span>
            <div className="flex bg-card rounded p-1">
              {INTENSITY_LABELS.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setIntensityLabel(label)}
                  className={`flex-1 text-center py-2 rounded text-sm font-semibold transition-colors ${
                    intensityLabel === label ? "bg-accent text-accent-ink" : "text-ink-soft"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <input type="hidden" name="intensityLabel" value={intensityLabel ?? ""} />
          </div>

          <label className={logLabelClass}>
            <span className={logCaptionClass}>Nota de intensidade (1–10)</span>
            <input
              name="intensityScore"
              type="number"
              min={1}
              max={10}
              value={intensityScore}
              onChange={(e) => setIntensityScore(e.target.value)}
              placeholder="Ex: 7"
              className={logInputClass}
            />
          </label>

          <label className={logLabelClass}>
            <span className={logCaptionClass}>Duração (minutos)</span>
            <input
              name="durationMin"
              type="number"
              min={0}
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              placeholder="Ex: 45"
              className={logInputClass}
            />
          </label>
        </>
      )}

      {state && "error" in state && <div className="text-sm text-accent font-medium">{state.error}</div>}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded bg-ink text-paper font-semibold text-[15px] disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Salvar registro"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveAnamnesisAndGeneratePlan, type AiActionResult } from "@/app/actions/ai";
import {
  ACTIVITY_LABEL,
  EXPERIENCE_LABEL,
  SEX_LABEL,
  TRAINING_LOCATION_LABEL,
  type Anamnesis,
} from "@/lib/anamnesis";

const inputClass =
  "h-11 rounded border border-line bg-paper px-3.5 text-[15px] outline-none focus:border-ink";
const labelClass = "flex flex-col gap-1.5";
const captionClass = "text-sm font-medium";

export default function AnamneseForm({ initial }: { initial: Anamnesis | null }) {
  const [state, formAction, pending] = useActionState<AiActionResult, FormData>(
    (_prev, formData) => saveAnamnesisAndGeneratePlan(formData),
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <h2 className="text-[13px] font-mono font-semibold uppercase tracking-[0.06em] text-ink-soft">
          Sobre você
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            <span className={captionClass}>Idade</span>
            <input name="age" type="number" min={10} max={100} defaultValue={initial?.age} required className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className={captionClass}>Sexo biológico</span>
            <select name="sex" defaultValue={initial?.sex ?? ""} required className={inputClass}>
              <option value="" disabled>Selecione</option>
              {Object.entries(SEX_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            <span className={captionClass}>Altura (cm)</span>
            <input name="height_cm" type="number" min={100} max={250} defaultValue={initial?.height_cm} required className={inputClass} />
          </label>
          <label className={labelClass}>
            <span className={captionClass}>Peso atual (kg)</span>
            <input name="weight_kg" type="number" step="0.1" min={30} max={300} defaultValue={initial?.weight_kg} required className={inputClass} />
          </label>
          <label className={`${labelClass} col-span-2`}>
            <span className={captionClass}>Peso objetivo (kg) — opcional</span>
            <input name="goal_weight_kg" type="number" step="0.1" min={30} max={300} defaultValue={initial?.goal_weight_kg ?? ""} className={inputClass} />
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[13px] font-mono font-semibold uppercase tracking-[0.06em] text-ink-soft">
          Sua rotina
        </h2>
        <div className="flex flex-col gap-3">
          <label className={labelClass}>
            <span className={captionClass}>Nível de atividade no dia a dia</span>
            <select name="activity_level" defaultValue={initial?.activity_level ?? ""} required className={inputClass}>
              <option value="" disabled>Selecione</option>
              {Object.entries(ACTIVITY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              <span className={captionClass}>Dias/semana pra treinar</span>
              <input name="days_per_week" type="number" min={1} max={7} defaultValue={initial?.days_per_week ?? 3} required className={inputClass} />
            </label>
            <label className={labelClass}>
              <span className={captionClass}>Experiência com treino</span>
              <select name="experience_level" defaultValue={initial?.experience_level ?? ""} required className={inputClass}>
                <option value="" disabled>Selecione</option>
                {Object.entries(EXPERIENCE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
          </div>
          <label className={labelClass}>
            <span className={captionClass}>Onde você treina</span>
            <select name="training_location" defaultValue={initial?.training_location ?? ""} required className={inputClass}>
              <option value="" disabled>Selecione</option>
              {Object.entries(TRAINING_LOCATION_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[13px] font-mono font-semibold uppercase tracking-[0.06em] text-ink-soft">
          Cuidados
        </h2>
        <div className="flex flex-col gap-3">
          <label className={labelClass}>
            <span className={captionClass}>Lesões ou restrições físicas — opcional</span>
            <textarea
              name="injuries"
              defaultValue={initial?.injuries ?? ""}
              rows={2}
              placeholder="Ex: dor no joelho direito, evitar impacto"
              className="rounded border border-line bg-paper px-3.5 py-2.5 text-[15px] outline-none focus:border-ink resize-none"
            />
          </label>
          <label className={labelClass}>
            <span className={captionClass}>Restrições alimentares — opcional</span>
            <textarea
              name="dietary_restrictions"
              defaultValue={initial?.dietary_restrictions ?? ""}
              rows={2}
              placeholder="Ex: vegetariano, intolerância a lactose"
              className="rounded border border-line bg-paper px-3.5 py-2.5 text-[15px] outline-none focus:border-ink resize-none"
            />
          </label>
          <label className={labelClass}>
            <span className={captionClass}>Mais alguma coisa? — opcional</span>
            <textarea
              name="notes"
              defaultValue={initial?.notes ?? ""}
              rows={2}
              placeholder="O que mais achar importante contar pro seu coach"
              className="rounded border border-line bg-paper px-3.5 py-2.5 text-[15px] outline-none focus:border-ink resize-none"
            />
          </label>
        </div>
      </section>

      <label className="flex items-start gap-2.5 text-sm text-ink-soft">
        <input
          name="health_consent"
          type="checkbox"
          required
          className="mt-0.5 w-4 h-4 flex-shrink-0 accent-ink"
        />
        <span>
          Autorizo o uso desses dados de saúde exclusivamente pra gerar meu treino e dieta
          personalizados, conforme a{" "}
          <Link href="/privacidade" target="_blank" className="font-semibold text-ink underline underline-offset-2">
            Política de Privacidade
          </Link>
          .
        </span>
      </label>

      {state && "error" in state && (
        <div className="text-sm text-accent font-medium">{state.error}</div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="h-13 rounded bg-ink text-paper font-semibold text-[15px] hover:bg-accent transition-colors disabled:opacity-60"
      >
        {pending ? "Gerando seu plano personalizado…" : "Gerar meu plano com IA"}
      </button>
      {pending && (
        <p className="text-xs text-ink-faint text-center -mt-2">
          Isso pode levar até um minuto.
        </p>
      )}
    </form>
  );
}

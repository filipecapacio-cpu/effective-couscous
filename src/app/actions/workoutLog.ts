"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { INTENSITY_LABELS, WORKOUT_MODALITIES, type IntensityLabel, type WorkoutModality, type WorkoutLogResult } from "@/lib/workoutLog";

const todayISO = () => new Date().toISOString().slice(0, 10);

/** Registra (ou atualiza) o treino que o usuário efetivamente fez hoje. Não mexe na recomendação/plano. */
export async function saveWorkoutLog(formData: FormData): Promise<WorkoutLogResult> {
  const userId = String(formData.get("userId") ?? "");
  const modality = String(formData.get("modality") ?? "");

  if (!userId || !WORKOUT_MODALITIES.includes(modality as WorkoutModality)) {
    return { error: "Selecione uma modalidade válida." };
  }

  const isRest = modality === "Descanso";

  const intensityLabelRaw = String(formData.get("intensityLabel") ?? "");
  const intensityLabel =
    !isRest && INTENSITY_LABELS.includes(intensityLabelRaw as IntensityLabel) ? intensityLabelRaw : null;

  const intensityScoreRaw = formData.get("intensityScore");
  const intensityScore = !isRest && intensityScoreRaw ? Number(intensityScoreRaw) : null;
  if (intensityScore !== null && (Number.isNaN(intensityScore) || intensityScore < 1 || intensityScore > 10)) {
    return { error: "A nota de intensidade deve ser entre 1 e 10." };
  }

  const durationRaw = formData.get("durationMin");
  const durationMin = !isRest && durationRaw ? Number(durationRaw) : null;
  if (durationMin !== null && (Number.isNaN(durationMin) || durationMin < 0)) {
    return { error: "Duração inválida." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("workout_logs").upsert(
    {
      user_id: userId,
      date: todayISO(),
      modality,
      intensity_label: intensityLabel,
      intensity_score: intensityScore,
      duration_min: durationMin,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,date" }
  );

  if (error) {
    console.error("[saveWorkoutLog] failed:", error);
    return { error: "Não foi possível salvar o registro. Tente de novo." };
  }

  revalidatePath("/plano");
  return { ok: true };
}

export const WORKOUT_MODALITIES = [
  "Luta",
  "Corrida",
  "Musculação",
  "Mobilidade",
  "Cardio/HIIT",
  "Alongamento",
  "Natação",
  "Ciclismo",
  "Yoga",
  "Funcional/Crossfit",
  "Descanso",
] as const;
export type WorkoutModality = (typeof WORKOUT_MODALITIES)[number];

export const INTENSITY_LABELS = ["Leve", "Moderado", "Intenso"] as const;
export type IntensityLabel = (typeof INTENSITY_LABELS)[number];

export type WorkoutLog = {
  modality: WorkoutModality;
  intensityLabel: IntensityLabel | null;
  intensityScore: number | null;
  durationMin: number | null;
};

export type WorkoutLogResult = { error: string } | { ok: true };

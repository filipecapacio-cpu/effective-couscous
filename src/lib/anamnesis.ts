export type Sex = "masculino" | "feminino" | "prefiro_nao_dizer";
export type ActivityLevel = "sedentario" | "leve" | "moderado" | "intenso";
export type TrainingLocation = "casa_sem_equipamento" | "casa_com_equipamento" | "academia";
export type ExperienceLevel = "iniciante" | "intermediario" | "avancado";

export type Anamnesis = {
  age: number;
  sex: Sex;
  height_cm: number;
  weight_kg: number;
  goal_weight_kg: number | null;
  activity_level: ActivityLevel;
  days_per_week: number;
  training_location: TrainingLocation;
  experience_level: ExperienceLevel;
  injuries: string | null;
  dietary_restrictions: string | null;
  notes: string | null;
};

export const SEX_LABEL: Record<Sex, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
  prefiro_nao_dizer: "Prefiro não dizer",
};

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentario: "Sedentário (pouco ou nenhum exercício)",
  leve: "Leve (exercício leve 1-3x/semana)",
  moderado: "Moderado (exercício moderado 3-5x/semana)",
  intenso: "Intenso (exercício pesado quase todo dia)",
};

export const TRAINING_LOCATION_LABEL: Record<TrainingLocation, string> = {
  casa_sem_equipamento: "Em casa, sem equipamento",
  casa_com_equipamento: "Em casa, com equipamento básico",
  academia: "Academia completa",
};

export const EXPERIENCE_LABEL: Record<ExperienceLevel, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

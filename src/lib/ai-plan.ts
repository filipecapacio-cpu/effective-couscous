import { z } from "zod";

const ExerciseSchema = z.object({
  name: z.string(),
  detail: z.string().describe("Ex: '3 séries · 10-12 reps' ou '4x20 · descanso 30s'"),
});

const MealSchema = z.object({
  name: z.string().describe("Ex: 'Café da manhã', 'Almoço'"),
  detail: z.string().describe("O que comer, de forma objetiva"),
  kcal: z.number().int().min(0).max(3000),
});

const DayPlanSchema = z.object({
  restDay: z.boolean().describe("true se este for um dia de descanso do treino"),
  workoutTitle: z.string(),
  durationMin: z.number().int().min(0).max(180),
  exercises: z.array(ExerciseSchema).max(10),
  meals: z.array(MealSchema).max(6),
});

export const WeekPlanSchema = z.object({
  summary: z
    .string()
    .describe("2-3 frases explicando a lógica do plano pro usuário, em português."),
  monday: DayPlanSchema,
  tuesday: DayPlanSchema,
  wednesday: DayPlanSchema,
  thursday: DayPlanSchema,
  friday: DayPlanSchema,
  saturday: DayPlanSchema,
  sunday: DayPlanSchema,
});

export type WeekPlan = z.infer<typeof WeekPlanSchema>;
export type DayPlan = z.infer<typeof DayPlanSchema>;

const WEEKDAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

/** Pega o dia do plano semanal correspondente a uma data (YYYY-MM-DD). */
export function dayPlanFor(plan: WeekPlan, dateISO: string): DayPlan {
  const weekday = WEEKDAY_KEYS[new Date(`${dateISO}T12:00:00Z`).getUTCDay()];
  return plan[weekday];
}

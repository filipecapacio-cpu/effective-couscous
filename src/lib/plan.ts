import { addDaysISO } from "@/lib/date";

export type Goal = "performance" | "emagrecimento" | "massa" | "habito";

export const GOAL_LABEL: Record<Goal, string> = {
  performance: "Performance esportiva",
  emagrecimento: "Emagrecimento",
  massa: "Ganho de massa",
  habito: "Consistência / hábito",
};

const WORKOUT_TITLE: Record<Goal, string> = {
  performance: "Base · Performance",
  emagrecimento: "Full Body · Queima",
  massa: "Upper Body · Força",
  habito: "Mobilidade · Comece leve",
};

/** Rotina inicial genérica — ponto de partida, não um plano personalizado. */
export const STARTER_EXERCISES = [
  { name: "Agachamento", detail: "3 séries · 10-12 reps" },
  { name: "Supino ou flexão", detail: "3 séries · 8-12 reps" },
  { name: "Remada", detail: "3 séries · 10-12 reps" },
  { name: "Prancha", detail: "3 séries · 30-45s" },
];

export const STARTER_MEALS = ["Café da manhã", "Almoço", "Lanche da tarde", "Jantar"];

export function starterWorkoutTitle(goal: Goal | null): string {
  return goal ? WORKOUT_TITLE[goal] : "Treino do dia";
}

type WorkoutDay = { date: string; allDone: boolean; hasExercises: boolean };

/**
 * Dias consecutivos (terminando hoje ou ontem) com o treino do dia
 * totalmente concluído. Um treino de hoje ainda em aberto não quebra a
 * sequência — só não conta ainda. `todayISO` vem de quem chama pra usar
 * sempre o mesmo "hoje" (fuso do app, não do servidor).
 */
export function computeStreak(days: WorkoutDay[], todayISO: string): number {
  const byDate = new Map(days.map((d) => [d.date, d]));
  let streak = 0;
  let cursorISO = todayISO;

  for (let i = 0; i < 365; i++) {
    const day = byDate.get(cursorISO);
    const isToday = i === 0;

    if (!day || !day.hasExercises) {
      if (isToday) {
        cursorISO = addDaysISO(cursorISO, -1);
        continue;
      }
      break;
    }

    if (day.allDone) {
      streak += 1;
    } else if (isToday) {
      // treino de hoje ainda em andamento — não quebra, também não soma.
    } else {
      break;
    }

    cursorISO = addDaysISO(cursorISO, -1);
  }

  return streak;
}

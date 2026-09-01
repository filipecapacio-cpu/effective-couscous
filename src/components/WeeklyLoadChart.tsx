import type { WeeklyLoadDay } from "@/lib/data";
import { weekdayOfISO } from "@/lib/date";

const DAY_LABEL = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

/**
 * Carga da semana: barras com o treino efetivamente registrado (workout_logs)
 * nos últimos 7 dias — histórico em cinza, descanso em hachura, hoje em accent.
 * Componente 04 do design system Onmode, adaptado pro Dashboard.
 * `today` vem de quem chama (mesmo "hoje" calculado no fuso do app).
 */
export function WeeklyLoadChart({ days, today }: { days: WeeklyLoadDay[]; today: string }) {
  const maxDuration = Math.max(60, ...days.map((d) => d.durationMin ?? 0));

  return (
    <div className="bg-card rounded-lg p-4.5 flex flex-col gap-3.5">
      <span className="text-[11px] font-mono uppercase tracking-[0.1em] text-ink-faint">
        Carga · 7 dias
      </span>
      <div className="flex items-end gap-2 h-16">
        {days.map((day) => {
          const isToday = day.date === today;
          const isRest = day.modality === "Descanso";
          const hasLog = day.durationMin !== null && day.durationMin > 0;

          const heightPct = isRest
            ? 26
            : hasLog
              ? Math.max(10, Math.round(((day.durationMin as number) / maxDuration) * 100))
              : 6;

          return (
            <div key={day.date} className="flex-1 h-full flex items-end bg-card-2">
              <div
                className={isRest ? "w-full onmode-hatch" : "w-full"}
                style={{
                  height: `${heightPct}%`,
                  background: isRest ? undefined : isToday ? "var(--accent)" : hasLog ? "var(--line-strong)" : "var(--card-2)",
                  opacity: isRest ? 0.6 : 1,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        {days.map((day) => {
          const isToday = day.date === today;
          const weekday = weekdayOfISO(day.date);
          return (
            <span
              key={day.date}
              className={`flex-1 text-center text-[10px] font-mono ${
                isToday ? "text-accent" : "text-ink-faint"
              }`}
            >
              {DAY_LABEL[weekday]}
            </span>
          );
        })}
      </div>
    </div>
  );
}

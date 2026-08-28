import type { HeatmapDay } from "@/lib/data";

const STATUS_COLOR: Record<HeatmapDay["status"], string> = {
  done: "var(--accent)",
  planned: "rgba(193, 90, 46, 0.35)",
  none: "rgba(255, 255, 255, 0.08)",
};

export default function Heatmap({ days }: { days: HeatmapDay[] }) {
  const dayNum = (iso: string) => Number(iso.slice(8, 10));

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => (
          <div
            key={day.date}
            title={`${day.date} · ${day.status === "done" ? "treino concluído" : day.status === "planned" ? "planejado" : "sem plano"}`}
            className="aspect-square rounded-[6px] flex items-center justify-center"
            style={{ background: STATUS_COLOR[day.status] }}
          >
            <span
              className="text-[9px] font-medium"
              style={{ color: day.status === "none" ? "var(--on-ink-faint)" : "var(--accent-ink)" }}
            >
              {dayNum(day.date)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[11px] text-on-ink-soft">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-[3px]" style={{ background: STATUS_COLOR.done }} />
          Concluído
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-[3px]" style={{ background: STATUS_COLOR.planned }} />
          Planejado
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-[3px]" style={{ background: STATUS_COLOR.none }} />
          Sem plano
        </div>
      </div>
    </div>
  );
}

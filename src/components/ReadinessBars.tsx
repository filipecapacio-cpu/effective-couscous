/**
 * Medidor de 3 barras do design system Onmode. Puramente visual — recebe um
 * score 0-100 já calculado alhures (não introduz lógica nova) e mapeia pros
 * três modos: peak (>=75, accent sólido), steady (45-74, branco sólido) e
 * recover (<45, hachura). Geometria fixa: larguras 12/19/28, alturas 34/52/72.
 */
export function ReadinessBars({
  score,
  size = "md",
  className,
}: {
  score: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const mode = clamped >= 75 ? "peak" : clamped >= 45 ? "steady" : "recover";

  const scale = size === "sm" ? 0.72 : 1;
  const bars = [
    { w: 12, h: 34, threshold: 0 },
    { w: 19, h: 52, threshold: 34 },
    { w: 28, h: 72, threshold: 67 },
  ];

  return (
    <span
      className={`inline-flex items-end flex-shrink-0 ${className ?? ""}`}
      style={{ gap: 10 * scale }}
      role="img"
      aria-label={`Prontidão ${Math.round(clamped)} de 100`}
    >
      {bars.map((bar, i) => {
        const barFillPct = Math.max(0, Math.min(1, (clamped - bar.threshold) / 33)) * 100;
        return (
          <span
            key={i}
            className="relative flex items-end overflow-hidden bg-card-2"
            style={{ width: bar.w * scale, height: bar.h * scale }}
          >
            <span
              className={mode === "recover" ? "onmode-hatch" : ""}
              style={{
                width: "100%",
                height: `${barFillPct}%`,
                background: mode === "peak" ? "var(--accent)" : mode === "steady" ? "var(--ink)" : undefined,
                opacity: mode === "recover" ? 0.6 : 1,
              }}
            />
          </span>
        );
      })}
    </span>
  );
}

export function readinessModeLabel(score: number): string {
  const clamped = Math.max(0, Math.min(100, score));
  if (clamped >= 75) return "Modo alta intensidade";
  if (clamped >= 45) return "Modo moderado";
  return "Modo recuperação";
}

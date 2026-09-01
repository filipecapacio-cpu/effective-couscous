import { forwardRef } from "react";
import { ReadinessBars } from "@/components/ReadinessBars";
import {
  BikeIcon,
  DumbbellIcon,
  FlameIcon,
  FootprintsIcon,
  HeartPulseIcon,
  MoveIcon,
  SwordsIcon,
  WavesIcon,
  WindIcon,
  YogaIcon,
} from "@/components/icons";
import type { IntensityLabel, WorkoutModality } from "@/lib/workoutLog";

// "Descanso" não é um treino a completar/compartilhar - não entra aqui.
const MODALITY_ICON: Record<Exclude<WorkoutModality, "Descanso">, React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>> = {
  Luta: SwordsIcon,
  Corrida: FootprintsIcon,
  "Musculação": DumbbellIcon,
  Mobilidade: MoveIcon,
  "Cardio/HIIT": HeartPulseIcon,
  Alongamento: WindIcon,
  "Natação": WavesIcon,
  Ciclismo: BikeIcon,
  Yoga: YogaIcon,
  "Funcional/Crossfit": FlameIcon,
};

export type WorkoutShareCardProps = {
  modality: Exclude<WorkoutModality, "Descanso">;
  durationMin: number | null;
  intensityLabel: IntensityLabel | null;
  intensityScore: number | null;
  dateLabel: string;
  format: "story" | "square";
};

/**
 * Card de resumo do treino pra exportar como imagem (estilo Strava).
 * Só usa dado que já existe de verdade no registro do treino - sem métrica
 * inventada por modalidade (pace, volume etc.) que o app ainda não coleta.
 */
const WorkoutShareCard = forwardRef<HTMLDivElement, WorkoutShareCardProps>(function WorkoutShareCard(
  { modality, durationMin, intensityLabel, intensityScore, dateLabel, format },
  ref
) {
  const Icon = MODALITY_ICON[modality];
  const isStory = format === "story";

  const hasDuration = durationMin != null;
  const hasIntensity = intensityScore != null;
  const readinessScore = hasIntensity ? intensityScore * 10 : 50;

  const headline = hasDuration
    ? { value: String(durationMin), unit: "MIN", caption: "tempo de treino" }
    : hasIntensity
      ? { value: String(intensityScore), unit: "/10", caption: "intensidade do treino" }
      : { value: "OK", unit: "", caption: "treino concluído" };

  // Se a duração virou o número grande, intensidade ainda cabe como stat -
  // se não tem duração, a intensidade já É o número grande, não repete aqui.
  const stats: { label: string; value: string }[] = [];
  if (hasDuration && intensityLabel) {
    stats.push({
      label: "INTENSIDADE",
      value: hasIntensity ? `${intensityLabel.toUpperCase()} ${intensityScore}/10` : intensityLabel.toUpperCase(),
    });
  }
  stats.push({ label: "DATA", value: dateLabel });

  return (
    <div
      ref={ref}
      className="bg-paper text-ink border border-line flex flex-col justify-between box-border"
      style={{
        width: isStory ? 270 : 320,
        height: isStory ? 480 : 320,
        padding: isStory ? "24px 22px" : "24px 26px",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* top row */}
      <div className="flex items-center justify-between">
        <ReadinessBars score={readinessScore} size="sm" />
        <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-[0.1em] uppercase text-ink-faint">
          <Icon size={12} className="text-accent" strokeWidth={2.2} />
          {modality}
        </div>
      </div>

      {/* headline metric */}
      <div>
        <div
          className="font-display font-extrabold tracking-[-0.04em] flex items-baseline gap-2"
          style={{ fontSize: isStory ? 76 : 62, lineHeight: 0.85, fontVariantNumeric: "tabular-nums" }}
        >
          {headline.value}
          {headline.unit && (
            <span className="font-mono font-medium text-ink-faint tracking-[0.08em]" style={{ fontSize: isStory ? 15 : 13 }}>
              {headline.unit}
            </span>
          )}
        </div>
        <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-ink-faint mt-1.5">{headline.caption}</div>
      </div>

      {/* stats row */}
      <div className="flex" style={{ gap: isStory ? 16 : 20 }}>
        {stats.map((s) => (
          <div key={s.label}>
            <div className="font-display font-bold tracking-[-0.02em] text-[17px] whitespace-nowrap">{s.value}</div>
            <div className="font-mono text-[8.5px] tracking-[0.08em] text-ink-faint mt-[3px] whitespace-nowrap">{s.label}</div>
          </div>
        ))}
      </div>

      {/* footer */}
      <div className="border-t border-line pt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 font-display font-bold text-[13px] tracking-[0.02em]">
          <span className="w-1.5 h-1.5 bg-accent flex-shrink-0" />
          TREINO CONCLUÍDO
        </div>
        <span className="font-mono text-[9px] tracking-[0.1em] uppercase text-ink-faint">onmode</span>
      </div>
    </div>
  );
});

export default WorkoutShareCard;

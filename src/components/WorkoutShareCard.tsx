import { forwardRef } from "react";
import type { IntensityLabel, WorkoutModality } from "@/lib/workoutLog";

export type WorkoutShareCardProps = {
  modality: Exclude<WorkoutModality, "Descanso">;
  durationMin: number | null;
  intensityLabel: IntensityLabel | null;
  intensityScore: number | null;
  dateLabel: string;
  format: "story" | "square";
};

const TEXT_SHADOW = "0 1px 3px rgba(0,0,0,0.7), 0 3px 12px rgba(0,0,0,0.45)";

/**
 * Card de resumo do treino pra exportar como imagem e virar sticker no
 * Stories/feed. Sem painel/caixa nenhuma atrás — texto branco direto sobre
 * a foto do usuário, com sombra pra continuar legível em qualquer fundo,
 * igual ao card de verdade do Strava (wordmark em cima, colunas de stat
 * embaixo). Só usa dado que já existe de verdade no registro do treino -
 * sem métrica inventada por modalidade (pace, volume etc.) que o app ainda
 * não coleta.
 */
const WorkoutShareCard = forwardRef<HTMLDivElement, WorkoutShareCardProps>(function WorkoutShareCard(
  { modality, durationMin, intensityLabel, intensityScore, dateLabel, format },
  ref
) {
  const isStory = format === "story";
  const hasDuration = durationMin != null;
  const hasIntensity = intensityScore != null;

  // Sempre no máximo 3 colunas (modalidade + uma métrica principal + data) -
  // igual ao card do Strava, pra não espremer numa largura de sticker
  // estreita. Duração tem prioridade sobre intensidade quando as duas
  // existem (mesma regra que já valia no header grande da versão anterior).
  const cols: { label: string; value: string }[] = [{ label: "Modalidade", value: modality }];
  if (hasDuration) {
    cols.push({ label: "Duração", value: `${durationMin} min` });
  } else if (intensityLabel) {
    cols.push({
      label: "Intensidade",
      value: hasIntensity ? `${intensityLabel} ${intensityScore}/10` : intensityLabel,
    });
  }
  cols.push({ label: "Data", value: dateLabel });

  return (
    <div
      ref={ref}
      className="flex flex-col gap-3.5 box-border text-white"
      style={{
        width: isStory ? 260 : 340,
        padding: 6,
        fontFamily: "var(--font-sans)",
      }}
    >
      <div className="flex items-center gap-2" style={{ textShadow: TEXT_SHADOW }}>
        <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
        <span className="font-display font-extrabold uppercase tracking-[0.01em] text-[17px] leading-none">
          onmode
        </span>
      </div>

      <div className="flex" style={{ gap: isStory ? 20 : 28 }}>
        {cols.map((c) => (
          <div key={c.label} style={{ textShadow: TEXT_SHADOW }}>
            <div className="font-mono text-[10px] tracking-[0.08em] uppercase opacity-85 whitespace-nowrap">
              {c.label}
            </div>
            <div className="font-display font-bold tracking-[-0.02em] text-[21px] leading-tight whitespace-nowrap mt-0.5">
              {c.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default WorkoutShareCard;

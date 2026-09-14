import {
  BikeIcon,
  DumbbellIcon,
  FootprintsIcon,
  HeartPulseIcon,
  LeafIcon,
  MoveIcon,
  SwordsIcon,
  WavesIcon,
  WindIcon,
  YogaIcon,
} from "@/components/icons";
import type { ReactElement } from "react";
import { formatWorkoutDate, type PostWorkout } from "@/lib/social";
import type { WorkoutModality } from "@/lib/workoutLog";

type IconComponent = (props: { size?: number; className?: string; strokeWidth?: number }) => ReactElement;

/**
 * Ícone por modalidade. Reaproveita os ícones que já existiam no set do
 * app (o mesmo conjunto que a tela de Plano usa), sem desenhar nenhum novo.
 */
const MODALITY_ICON: Record<WorkoutModality, IconComponent> = {
  Luta: SwordsIcon,
  Corrida: FootprintsIcon,
  "Musculação": DumbbellIcon,
  Mobilidade: MoveIcon,
  "Cardio/HIIT": HeartPulseIcon,
  Alongamento: WindIcon,
  "Natação": WavesIcon,
  Ciclismo: BikeIcon,
  Yoga: YogaIcon,
  "Funcional/Crossfit": DumbbellIcon,
  Descanso: LeafIcon,
};

export function ModalityIcon({ modality, size = 16, className }: { modality: WorkoutModality; size?: number; className?: string }) {
  const Icon = MODALITY_ICON[modality] ?? DumbbellIcon;
  return <Icon size={size} className={className} />;
}

/**
 * Linha de métricas do treino de um post.
 *
 * Mesma gramática visual do WorkoutShareCard (label em mono maiúsculo,
 * valor em Archivo bold): label pequeno em cima, número grande embaixo.
 * Só mostra o que o registro realmente tem — nada de métrica inventada por
 * modalidade (pace, volume) que o app não coleta.
 */
export default function WorkoutStatRow({ workout }: { workout: PostWorkout }) {
  const stats: { label: string; value: string }[] = [
    { label: "Modalidade", value: workout.modality },
  ];

  if (workout.duration_min != null) {
    stats.push({ label: "Duração", value: `${workout.duration_min} min` });
  }

  if (workout.intensity_label) {
    stats.push({
      label: "Intensidade",
      value:
        workout.intensity_score != null
          ? `${workout.intensity_label} ${workout.intensity_score}/10`
          : workout.intensity_label,
    });
  }

  stats.push({ label: "Data", value: formatWorkoutDate(workout.date) });

  return (
    <div className="flex gap-5 overflow-x-auto px-4 py-3 border-t border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {stats.map((stat) => (
        <div key={stat.label} className="flex-shrink-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint whitespace-nowrap">
            {stat.label}
          </div>
          <div className="font-display font-bold uppercase tracking-[-0.02em] text-[17px] leading-tight text-ink whitespace-nowrap mt-0.5">
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}

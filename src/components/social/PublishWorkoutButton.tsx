import Link from "next/link";
import { CameraIcon, ChevronRightIcon, PeopleIcon } from "@/components/icons";

/**
 * Atalho da tela de Plano pro feed, logo depois de registrar o treino.
 *
 * Esse é o momento em que a pessoa acabou de treinar — de longe o melhor
 * ponto de entrada pra publicação. Antes disso, o social só era alcançável
 * pela aba do BottomNav e pelo Perfil.
 *
 * Diferente do card de compartilhamento que fica ao lado (que é Pro), este
 * botão aparece pra TODO MUNDO: o feed social não tem checagem de plano
 * nenhuma, nem pra ler nem pra publicar.
 */
export default function PublishWorkoutButton({
  workoutLogId,
  /** Id do post, quando esse treino já virou publicação. */
  publishedPostId,
}: {
  workoutLogId: string | null;
  publishedPostId: string | null;
}) {
  // Um treino vira no máximo um post (UNIQUE em posts.workout_log_id), então
  // depois de publicado o convite dá lugar ao link da publicação.
  if (publishedPostId) {
    return (
      <Link
        href={`/social/post/${publishedPostId}`}
        className="flex items-center gap-2.5 h-11 px-4 rounded-lg border border-line text-[13px] text-ink-soft"
      >
        <PeopleIcon size={17} className="text-ink-faint flex-shrink-0" />
        <span className="flex-1 text-left">Publicado no feed</span>
        <ChevronRightIcon size={15} className="text-ink-faint flex-shrink-0" />
      </Link>
    );
  }

  // Sem id não dá pra pré-selecionar o treino; manda pra tela de publicação
  // mesmo assim, onde ele aparece no topo da lista (ordenada por data).
  const href = workoutLogId ? `/social/novo?treino=${workoutLogId}` : "/social/novo";

  return (
    <Link
      href={href}
      className="flex items-center justify-center gap-2 h-12 rounded-lg bg-ink text-paper font-semibold text-[15px] active:opacity-90"
    >
      <CameraIcon size={18} strokeWidth={1.8} />
      Publicar no feed
    </Link>
  );
}

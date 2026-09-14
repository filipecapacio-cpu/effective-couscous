/**
 * Avatar do atleta: a inicial num círculo accent, igual ao que a tela de
 * Perfil já faz hoje. A v1 não tem upload de foto de perfil — a coluna
 * `social_profiles.avatar_path` existe pra isso mas ainda não é usada.
 */
export default function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase();

  return (
    <div
      className="rounded-full bg-accent flex items-center justify-center font-display font-bold text-accent-ink flex-shrink-0"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      aria-hidden
    >
      {initial}
    </div>
  );
}

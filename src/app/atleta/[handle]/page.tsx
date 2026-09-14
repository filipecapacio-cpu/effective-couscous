export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import SetupNotice from "@/components/SetupNotice";
import Avatar from "@/components/social/Avatar";
import FeedList from "@/components/social/FeedList";
import { BackArrowIcon, InstagramIcon, TikTokIcon } from "@/components/icons";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getAuthorByHandle, getAuthorPage, getAuthorStats, getViewer } from "@/lib/social";

const JOINED_FMT = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });

export default async function AtletaPage(props: PageProps<"/atleta/[handle]">) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const { handle } = await props.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const author = await getAuthorByHandle(supabase, handle);
  if (!author) notFound();

  const [viewer, page, stats] = await Promise.all([
    getViewer(supabase, user.id),
    getAuthorPage(supabase, author.id, user.id, null),
    getAuthorStats(supabase, author.id),
  ]);

  const isSelf = author.id === user.id;
  const hours = Math.floor(stats.totalMinutes / 60);
  const statTiles = [
    { value: String(stats.posts), label: "publicações" },
    { value: hours > 0 ? `${hours}h` : `${stats.totalMinutes}min`, label: "registrados" },
    { value: stats.topModality ?? "—", label: "mais frequente" },
  ];

  return (
    <div className="mx-auto w-full max-w-[420px] min-h-svh flex flex-col">
      <header className="px-4 pt-5 pb-4 flex items-center gap-3">
        <Link href="/social" aria-label="Voltar ao feed" className="p-1 -ml-1 text-ink-soft">
          <BackArrowIcon size={22} />
        </Link>
        <h1 className="font-mono text-[13px] uppercase tracking-[0.08em] text-ink-soft">Atleta</h1>
      </header>

      <main className="flex-1 px-4 pb-6 flex flex-col gap-4">
        <section className="bg-card rounded-lg p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3.5">
            <Avatar name={author.display_name} size={52} />
            <div className="min-w-0">
              <div className="font-display font-bold uppercase tracking-[-0.02em] text-[22px] leading-tight truncate">
                {author.display_name}
              </div>
              <div className="text-[12px] font-mono text-ink-faint truncate">
                @{author.handle} · desde {JOINED_FMT.format(new Date(author.created_at))}
              </div>
            </div>
          </div>

          {author.bio && <p className="text-[13px] text-ink-soft leading-relaxed">{author.bio}</p>}

          {/*
            A URL é montada aqui a partir do @ guardado no banco — o banco
            nunca guarda link. `encodeURIComponent` é cinto e suspensório em
            cima do CHECK da migration 0024, que já só aceita
            letras/números/ponto/underscore.
            rel="noopener noreferrer" porque são links pra fora do app.
          */}
          {(author.instagram_handle || author.tiktok_handle) && (
            <div className="flex flex-wrap gap-2">
              {author.instagram_handle && (
                <a
                  href={`https://instagram.com/${encodeURIComponent(author.instagram_handle)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 h-9 px-3 rounded-lg bg-card-2 text-[13px] text-ink-soft active:opacity-80"
                >
                  <InstagramIcon size={16} className="flex-shrink-0" />
                  <span className="truncate max-w-[130px]">@{author.instagram_handle}</span>
                </a>
              )}
              {author.tiktok_handle && (
                <a
                  href={`https://tiktok.com/@${encodeURIComponent(author.tiktok_handle)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 h-9 px-3 rounded-lg bg-card-2 text-[13px] text-ink-soft active:opacity-80"
                >
                  <TikTokIcon size={16} className="flex-shrink-0" />
                  <span className="truncate max-w-[130px]">@{author.tiktok_handle}</span>
                </a>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {statTiles.map((tile) => (
              <div key={tile.label} className="flex-1 bg-card-2 rounded-lg p-3 min-w-0">
                <div className="font-display font-bold tracking-[-0.02em] text-[17px] leading-tight truncate">
                  {tile.value}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint truncate">
                  {tile.label}
                </div>
              </div>
            ))}
          </div>

          {/*
            As estatísticas contam só o que virou publicação: a policy
            "workout_logs: select if published" é justamente o que mantém o
            resto do histórico de treino privado, inclusive aqui.
          */}
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">
            Considera apenas treinos publicados
          </p>
        </section>

        <FeedList
          initialPosts={page.posts}
          initialCursor={page.nextCursor}
          viewer={viewer}
          source={{ kind: "author", authorId: author.id }}
          emptyState={
            <div className="bg-card rounded-lg p-6">
              <p className="text-[13px] text-ink-soft leading-relaxed">
                {isSelf
                  ? "Você ainda não publicou nenhum treino."
                  : `${author.display_name} ainda não publicou nenhum treino.`}
              </p>
            </div>
          }
        />
      </main>

      <BottomNav />
    </div>
  );
}

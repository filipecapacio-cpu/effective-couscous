"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import PostCard from "@/components/social/PostCard";
import { fetchAuthorPage, fetchFeedPage } from "@/app/actions/social";
import type { FeedCursor, FeedPost, SocialAuthor } from "@/lib/social";

export type FeedSource = { kind: "feed" } | { kind: "author"; authorId: string };

/**
 * Lista paginada de posts, usada tanto pelo feed aberto quanto pelo perfil
 * público.
 *
 * A primeira página vem renderizada do servidor (bom pro LCP no celular); as
 * seguintes entram por Server Action quando o sentinela no fim da lista
 * aparece na tela. O botão "Carregar mais" continua ali de propósito: é o
 * caminho por teclado e o resgate quando o IntersectionObserver não dispara
 * (acontece em alguns navegadores dentro de webview).
 */
export default function FeedList({
  initialPosts,
  initialCursor,
  viewer,
  source,
  emptyState,
}: {
  initialPosts: FeedPost[];
  initialCursor: FeedCursor | null;
  viewer: SocialAuthor | null;
  source: FeedSource;
  emptyState: ReactNode;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Trava de reentrada. O estado `loading` sozinho não serve: o observador
  // pode disparar duas vezes antes do React re-renderizar, e as duas
  // chamadas leriam `loading` ainda como false e buscariam a mesma página.
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !cursor) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const page =
        source.kind === "feed"
          ? await fetchFeedPage(cursor)
          : await fetchAuthorPage(source.authorId, cursor);

      setPosts((current) => {
        // O feed muda embaixo do usuário enquanto ele rola; sem isso um post
        // pode aparecer duas vezes na virada de página.
        const seen = new Set(current.map((p) => p.id));
        return [...current, ...page.posts.filter((p) => !seen.has(p.id))];
      });
      setCursor(page.nextCursor);
    } catch (err) {
      console.error("[FeedList] falhou ao carregar mais:", err);
      setError("Não consegui carregar mais publicações.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [cursor, source]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !cursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      // Começa a buscar antes de a pessoa chegar no fim, pra a próxima
      // página já estar lá quando ela alcançar.
      { rootMargin: "600px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  function handleDeleted(postId: string) {
    setPosts((current) => current.filter((p) => p.id !== postId));
  }

  if (posts.length === 0) return <>{emptyState}</>;

  return (
    <div className="flex flex-col gap-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} viewer={viewer} onDeleted={handleDeleted} />
      ))}

      <div ref={sentinelRef} aria-hidden className="h-px" />

      {cursor && (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={loading}
          className="mx-auto my-4 px-5 py-2.5 rounded-lg border border-line text-[13px] text-ink-soft disabled:opacity-50"
        >
          {loading ? "Carregando…" : "Carregar mais"}
        </button>
      )}

      {!cursor && posts.length > 0 && (
        <p className="text-center text-[12px] font-mono uppercase tracking-[0.08em] text-ink-faint py-6">
          Você chegou ao fim
        </p>
      )}

      {error && <p className="text-center text-[13px] text-ink-soft pb-4">{error}</p>}
    </div>
  );
}

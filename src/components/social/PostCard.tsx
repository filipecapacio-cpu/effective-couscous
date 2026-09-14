"use client";

import { useOptimistic, useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/social/Avatar";
import PostMediaCarousel from "@/components/social/PostMediaCarousel";
import WorkoutStatRow from "@/components/social/WorkoutStatRow";
import { CommentIcon, HeartIcon, SendIcon, TrashIcon } from "@/components/icons";
import { addComment, deleteComment, deletePost, toggleLike } from "@/app/actions/social";
import {
  MAX_COMMENT_LENGTH,
  formatRelativeTime,
  type FeedPost,
  type PostComment,
  type SocialAuthor,
} from "@/lib/social";

type LikeState = { liked: boolean; count: number };

export default function PostCard({
  post,
  viewer,
  /** Na tela do post os comentários já vêm todos — sem link de "ver todos". */
  expanded = false,
  initialComments,
  onDeleted,
}: {
  post: FeedPost;
  viewer: SocialAuthor | null;
  expanded?: boolean;
  initialComments?: PostComment[];
  onDeleted?: (postId: string) => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [like, setLike] = useState<LikeState>({ liked: post.liked, count: post.like_count });
  // A curtida precisa responder no toque, não depois do round-trip — quem
  // rola um feed no celular toca e já rola pra baixo.
  const [optimisticLike, applyOptimisticLike] = useOptimistic(like, (_prev, next: LikeState) => next);

  const [comments, setComments] = useState<PostComment[]>(initialComments ?? post.commentPreview);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [composing, setComposing] = useState(expanded);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isOwner = viewer?.id === post.author.id;

  if (removed) return null;

  function handleLike() {
    const next: LikeState = optimisticLike.liked
      ? { liked: false, count: Math.max(optimisticLike.count - 1, 0) }
      : { liked: true, count: optimisticLike.count + 1 };

    startTransition(async () => {
      applyOptimisticLike(next);
      const result = await toggleLike(post.id);
      if ("error" in result) {
        // Sem commit: ao fim da transition o useOptimistic volta sozinho
        // pro estado confirmado.
        setError(result.error);
        return;
      }
      // O servidor é quem decide. Se ele concorda com o que já estava
      // confirmado (dois toques rápidos que se anularam), não há o que
      // mudar; senão o contador anda um na direção que ele mandou.
      setLike((current) =>
        current.liked === result.liked
          ? current
          : { liked: result.liked, count: Math.max(current.count + (result.liked ? 1 : -1), 0) }
      );
    });
  }

  async function handleComment(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending || !viewer) return;

    setSending(true);
    setError(null);
    const result = await addComment(post.id, body);
    setSending(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    setComments((current) => [
      ...current,
      { id: result.id, body, created_at: result.createdAt, author: viewer },
    ]);
    setCommentCount((n) => n + 1);
    setDraft("");
  }

  async function handleDeleteComment(commentId: string) {
    const previous = comments;
    setComments((current) => current.filter((c) => c.id !== commentId));
    setCommentCount((n) => Math.max(n - 1, 0));

    const result = await deleteComment(commentId, post.id);
    if ("error" in result) {
      setComments(previous);
      setCommentCount((n) => n + 1);
      setError(result.error);
    }
  }

  async function handleDeletePost() {
    if (!confirm("Apagar esta publicação? As fotos também serão removidas.")) return;

    const result = await deletePost(post.id);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setRemoved(true);
    onDeleted?.(post.id);
    if (expanded) router.push("/social");
    else router.refresh();
  }

  const hiddenComments = commentCount - comments.length;

  return (
    <article className="bg-card rounded-lg overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3">
        <Link href={`/atleta/${post.author.handle}`} className="flex items-center gap-3 min-w-0">
          <Avatar name={post.author.display_name} />
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{post.author.display_name}</div>
            <div className="text-[11px] font-mono text-ink-faint truncate">
              @{post.author.handle} · {formatRelativeTime(post.created_at)}
            </div>
          </div>
        </Link>

        {isOwner && (
          <button
            type="button"
            onClick={handleDeletePost}
            aria-label="Apagar publicação"
            className="ml-auto p-2 -mr-2 text-ink-faint active:text-ink"
          >
            <TrashIcon size={18} />
          </button>
        )}
      </header>

      <PostMediaCarousel
        media={post.media}
        alt={`Treino de ${post.workout.modality} de ${post.author.display_name}`}
      />

      <WorkoutStatRow workout={post.workout} />

      <div className="flex items-center gap-5 px-4 py-3 border-t border-line">
        <button
          type="button"
          onClick={handleLike}
          aria-pressed={optimisticLike.liked}
          aria-label={optimisticLike.liked ? "Descurtir" : "Curtir"}
          className={`flex items-center gap-2 text-sm ${
            optimisticLike.liked ? "text-accent" : "text-ink-soft"
          }`}
        >
          <HeartIcon size={21} filled={optimisticLike.liked} />
          <span className="font-mono text-[13px] tabular-nums">{optimisticLike.count}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setComposing(true);
            // O foco só existe depois que o input entra na árvore.
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
          aria-label="Comentar"
          className="flex items-center gap-2 text-sm text-ink-soft"
        >
          <CommentIcon size={20} />
          <span className="font-mono text-[13px] tabular-nums">{commentCount}</span>
        </button>
      </div>

      {post.caption && (
        <p className="px-4 pb-3 text-sm leading-relaxed whitespace-pre-line break-words">
          {post.caption}
        </p>
      )}

      {(comments.length > 0 || composing) && (
        <div className="px-4 pb-3 flex flex-col gap-2">
          {!expanded && hiddenComments > 0 && (
            <Link href={`/social/post/${post.id}`} className="text-[13px] text-ink-faint">
              Ver todos os {commentCount} comentários
            </Link>
          )}

          {comments.map((comment) => (
            <div key={comment.id} className="text-[13px] leading-snug flex items-start gap-2 group">
              <span className="min-w-0 break-words">
                <Link href={`/atleta/${comment.author.handle}`} className="font-semibold">
                  {comment.author.display_name}
                </Link>{" "}
                <span className="text-ink-soft">{comment.body}</span>
              </span>
              {(comment.author.id === viewer?.id || isOwner) && (
                <button
                  type="button"
                  onClick={() => handleDeleteComment(comment.id)}
                  aria-label="Apagar comentário"
                  className="ml-auto p-1 -m-1 text-ink-faint flex-shrink-0"
                >
                  <TrashIcon size={13} />
                </button>
              )}
            </div>
          ))}

          {composing && viewer && (
            <form onSubmit={handleComment} className="flex items-center gap-2 mt-1">
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={MAX_COMMENT_LENGTH}
                placeholder="Comentar…"
                aria-label="Escrever comentário"
                className="flex-1 min-w-0 bg-card-2 rounded-lg px-3 py-2 text-[13px] placeholder:text-ink-faint outline-none focus:ring-1 focus:ring-line-strong"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                aria-label="Enviar comentário"
                className="p-2 text-accent disabled:text-ink-faint"
              >
                <SendIcon size={18} />
              </button>
            </form>
          )}
        </div>
      )}

      {error && <p className="px-4 pb-3 text-[13px] text-ink-soft">{error}</p>}
    </article>
  );
}

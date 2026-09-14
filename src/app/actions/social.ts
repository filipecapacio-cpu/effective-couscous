"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  FEED_PAGE_SIZE,
  HANDLE_PATTERN,
  INSTAGRAM_PATTERN,
  MAX_BIO_LENGTH,
  MAX_CAPTION_LENGTH,
  MAX_COMMENT_LENGTH,
  MAX_POST_MEDIA,
  POST_MEDIA_BUCKET,
  TIKTOK_PATTERN,
  getAuthorPage,
  getFeedPage,
  normalizeSocialHandle,
  type FeedCursor,
  type FeedPage,
} from "@/lib/social";

export type SocialResult = { error: string } | { ok: true };

/** Mensagem única pra falha inesperada — o detalhe vai pro log do servidor. */
const GENERIC_ERROR = "Não foi possível completar a ação. Tenta de novo.";

/**
 * Toda action aqui começa por isto. Server Action é um endpoint POST de
 * verdade, alcançável fora da UI: quem é o usuário tem que ser resolvido
 * pela sessão, nunca vir de um parâmetro que o cliente manda.
 */
async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

// ── Identidade pública ─────────────────────────────────────────────────────

export type MediaInput = { storage_path: string; width: number | null; height: number | null };

/**
 * Cria a identidade pública do usuário (o @ dele). Passo obrigatório antes
 * do primeiro post — `posts.user_id` tem FK pra `social_profiles`.
 */
export async function createSocialProfile(formData: FormData): Promise<SocialResult> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { error: "Sessão expirada. Entra de novo." };

  const handle = String(formData.get("handle") ?? "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!HANDLE_PATTERN.test(handle)) {
    return { error: "O @ precisa ter de 3 a 20 caracteres, só letras minúsculas, números e _." };
  }
  if (displayName.length < 1 || displayName.length > 40) {
    return { error: "O nome precisa ter entre 1 e 40 caracteres." };
  }

  const { error } = await supabase
    .from("social_profiles")
    .insert({ id: userId, handle, display_name: displayName });

  if (error) {
    // 23505 = unique_violation. Pode ser o handle de outra pessoa ou a
    // própria linha já existindo (duplo clique no botão).
    if (error.code === "23505") {
      return { error: "Esse @ já está em uso. Escolhe outro." };
    }
    console.error("[createSocialProfile] failed:", error);
    return { error: GENERIC_ERROR };
  }

  revalidatePath("/social");
  return { ok: true };
}

/**
 * Edita a identidade pública (o @, o nome e a bio).
 *
 * Trocar o handle muda a URL do perfil (`/atleta/[handle]`): links antigos
 * param de resolver. É o mesmo comportamento de qualquer rede social e a
 * tela avisa antes de salvar.
 */
export async function updateSocialProfile(formData: FormData): Promise<SocialResult> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { error: "Sessão expirada. Entra de novo." };

  const handle = String(formData.get("handle") ?? "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  if (!HANDLE_PATTERN.test(handle)) {
    return { error: "O @ precisa ter de 3 a 20 caracteres, só letras minúsculas, números e _." };
  }
  if (displayName.length < 1 || displayName.length > 40) {
    return { error: "O nome precisa ter entre 1 e 40 caracteres." };
  }
  if (bio.length > MAX_BIO_LENGTH) {
    return { error: `A bio passa de ${MAX_BIO_LENGTH} caracteres.` };
  }

  // Normaliza antes de validar: quem cola a URL inteira do perfil não
  // deveria levar erro por isso.
  const instagram = normalizeSocialHandle(String(formData.get("instagram") ?? ""));
  const tiktok = normalizeSocialHandle(String(formData.get("tiktok") ?? ""));

  if (instagram && !INSTAGRAM_PATTERN.test(instagram)) {
    return { error: "@ do Instagram inválido. Use até 30 caracteres, sem espaço." };
  }
  if (tiktok && !TIKTOK_PATTERN.test(tiktok)) {
    return { error: "@ do TikTok inválido. Use até 24 caracteres, sem espaço." };
  }

  const { error } = await supabase
    .from("social_profiles")
    .update({
      handle,
      display_name: displayName,
      bio: bio || null,
      instagram_handle: instagram || null,
      tiktok_handle: tiktok || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    if (error.code === "23505") return { error: "Esse @ já está em uso. Escolhe outro." };
    console.error("[updateSocialProfile] failed:", error);
    return { error: GENERIC_ERROR };
  }

  revalidatePath("/perfil");
  revalidatePath("/social");
  return { ok: true };
}

// ── Publicação ─────────────────────────────────────────────────────────────

/**
 * Publica um treino já registrado.
 *
 * A validação de posse acontece em duas camadas de propósito: aqui em cima
 * (pra devolver uma mensagem boa pro usuário) e dentro da função
 * create_post_with_media no banco (que é o que de fato impede publicar o
 * treino de outra pessoa, mesmo se alguém chamar esta action fora da UI).
 */
export async function createPost(
  workoutLogId: string,
  caption: string,
  media: MediaInput[]
): Promise<{ error: string } | { ok: true; postId: string }> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { error: "Sessão expirada. Entra de novo." };

  if (media.length < 1) return { error: "Anexa pelo menos uma foto pra publicar." };
  if (media.length > MAX_POST_MEDIA) return { error: `No máximo ${MAX_POST_MEDIA} fotos por post.` };
  if (caption.length > MAX_CAPTION_LENGTH) {
    return { error: `A legenda passa de ${MAX_CAPTION_LENGTH} caracteres.` };
  }

  // Confere que todo caminho está dentro da pasta do próprio usuário antes
  // de mandar pro banco — é o mesmo que a policy de Storage e a função SQL
  // já checam, mas aqui a mensagem de erro é útil em vez de críptica.
  if (media.some((m) => !m.storage_path.startsWith(`${userId}/`))) {
    console.error("[createPost] caminho de mídia fora da pasta do usuário", { userId });
    return { error: GENERIC_ERROR };
  }

  const { data: log, error: logError } = await supabase
    .from("workout_logs")
    .select("id, modality")
    .eq("id", workoutLogId)
    .eq("user_id", userId)
    .maybeSingle();

  if (logError) {
    console.error("[createPost] failed to load workout log:", logError);
    return { error: GENERIC_ERROR };
  }
  if (!log) return { error: "Esse treino não está no seu histórico." };
  if (log.modality === "Descanso") return { error: "Dia de descanso não vira publicação." };

  const { data, error } = await supabase.rpc("create_post_with_media", {
    p_workout_log_id: workoutLogId,
    p_caption: caption,
    p_media: media,
  });

  if (error) {
    // 23505 no workout_log_id = esse treino já virou post (a UI filtra os
    // treinos já publicados, mas dois envios em paralelo chegam aqui).
    if (error.code === "23505") return { error: "Esse treino já foi publicado." };
    console.error("[createPost] rpc failed:", error);
    return { error: GENERIC_ERROR };
  }

  revalidatePath("/social");
  revalidatePath("/social/novo");
  return { ok: true, postId: data as string };
}

/**
 * Apaga o post e as fotos dele.
 *
 * A linha do banco sai por cascata (post_media, curtidas e comentários
 * vão junto). Os arquivos no Storage não saem por cascata nenhuma — sem
 * este delete explícito eles ficariam ocupando espaço pago pra sempre.
 */
export async function deletePost(postId: string): Promise<SocialResult> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { error: "Sessão expirada. Entra de novo." };

  const { data: post, error: loadError } = await supabase
    .from("posts")
    .select("id, user_id, post_media (storage_path)")
    .eq("id", postId)
    .maybeSingle();

  if (loadError) {
    console.error("[deletePost] failed to load post:", loadError);
    return { error: GENERIC_ERROR };
  }
  if (!post) return { error: "Publicação não encontrada." };
  if (post.user_id !== userId) return { error: "Você só pode apagar as suas publicações." };

  const paths = ((post.post_media ?? []) as { storage_path: string }[]).map((m) => m.storage_path);

  // Storage primeiro: se o delete da linha passasse e o do arquivo
  // falhasse, os caminhos seriam perdidos e o arquivo ficaria órfão sem
  // nada apontando pra ele.
  if (paths.length > 0) {
    const { error: storageError } = await supabase.storage.from(POST_MEDIA_BUCKET).remove(paths);
    if (storageError) {
      console.error("[deletePost] failed to remove media:", storageError);
      return { error: GENERIC_ERROR };
    }
  }

  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) {
    console.error("[deletePost] failed:", error);
    return { error: GENERIC_ERROR };
  }

  revalidatePath("/social");
  revalidatePath("/social/novo");
  return { ok: true };
}

/**
 * Apaga arquivos que já subiram mas cujo post nunca foi criado (a pessoa
 * fechou a tela no meio). Chamado pelo formulário ao remover uma foto da
 * seleção — sem isso, todo upload abandonado viraria custo permanente.
 */
export async function discardUploadedMedia(paths: string[]): Promise<SocialResult> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { error: "Sessão expirada. Entra de novo." };

  const own = paths.filter((p) => p.startsWith(`${userId}/`));
  if (own.length === 0) return { ok: true };

  const { error } = await supabase.storage.from(POST_MEDIA_BUCKET).remove(own);
  if (error) {
    // Não vale travar o usuário por causa disso: o arquivo fica órfão, mas
    // a tela dele continua funcionando.
    console.error("[discardUploadedMedia] failed:", error);
  }
  return { ok: true };
}

// ── Curtir e comentar ──────────────────────────────────────────────────────

/** Curte ou descurte. Devolve o estado final pra UI confirmar o otimista. */
export async function toggleLike(
  postId: string
): Promise<{ error: string } | { ok: true; liked: boolean }> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { error: "Sessão expirada. Entra de novo." };

  const { data: existing, error: readError } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) {
    console.error("[toggleLike] failed to read like:", readError);
    return { error: GENERIC_ERROR };
  }

  if (existing) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
    if (error) {
      console.error("[toggleLike] failed to delete:", error);
      return { error: GENERIC_ERROR };
    }
    return { ok: true, liked: false };
  }

  const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: userId });
  if (error) {
    // 23505 = alguém clicou duas vezes rápido e as duas chamadas chegaram.
    // O estado final é o mesmo, então não é erro pro usuário.
    if (error.code === "23505") return { ok: true, liked: true };
    console.error("[toggleLike] failed to insert:", error);
    return { error: GENERIC_ERROR };
  }

  return { ok: true, liked: true };
}

export async function addComment(
  postId: string,
  body: string
): Promise<{ error: string } | { ok: true; id: string; createdAt: string }> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { error: "Sessão expirada. Entra de novo." };

  const trimmed = body.trim();
  if (trimmed.length < 1) return { error: "Escreve alguma coisa antes de enviar." };
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return { error: `O comentário passa de ${MAX_COMMENT_LENGTH} caracteres.` };
  }

  const { data, error } = await supabase
    .from("post_comments")
    .insert({ post_id: postId, user_id: userId, body: trimmed })
    .select("id, created_at")
    .single();

  if (error) {
    // 23503 = foreign_key_violation: sem social_profile ainda, ou o post foi
    // apagado entre carregar o feed e comentar.
    if (error.code === "23503") return { error: "Essa publicação não existe mais." };
    console.error("[addComment] failed:", error);
    return { error: GENERIC_ERROR };
  }

  revalidatePath(`/social/post/${postId}`);
  return { ok: true, id: data.id as string, createdAt: data.created_at as string };
}

/** A policy do banco permite ao autor do comentário e ao dono do post. */
export async function deleteComment(commentId: string, postId: string): Promise<SocialResult> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { error: "Sessão expirada. Entra de novo." };

  const { error, count } = await supabase
    .from("post_comments")
    .delete({ count: "exact" })
    .eq("id", commentId);

  if (error) {
    console.error("[deleteComment] failed:", error);
    return { error: GENERIC_ERROR };
  }
  // RLS não devolve erro quando barra um delete — ela só não encontra a
  // linha. Zero linhas afetadas aqui significa "não era seu pra apagar".
  if (count === 0) return { error: "Você não pode apagar esse comentário." };

  revalidatePath(`/social/post/${postId}`);
  return { ok: true };
}

// ── Paginação ──────────────────────────────────────────────────────────────

/** Próxima página do feed, chamada pelo scroll infinito. */
export async function fetchFeedPage(cursor: FeedCursor | null): Promise<FeedPage> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { posts: [], nextCursor: null };
  return getFeedPage(supabase, userId, cursor);
}

/** Próxima página dos posts de um atleta, no perfil público. */
export async function fetchAuthorPage(authorId: string, cursor: FeedCursor | null): Promise<FeedPage> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { posts: [], nextCursor: null };
  return getAuthorPage(supabase, authorId, userId, cursor);
}

// ── Treinos disponíveis pra publicar ───────────────────────────────────────

export type PublishableWorkout = {
  id: string;
  date: string;
  modality: string;
  intensity_label: string | null;
  intensity_score: number | null;
  duration_min: number | null;
};

/**
 * Treinos do próprio usuário que ainda não viraram post.
 *
 * Nunca recebe um userId por parâmetro: usa o da sessão. O filtro de "já
 * publicado" é feito em memória porque `not.in` com uma lista longa de
 * uuids estoura o tamanho da URL do PostgREST.
 */
export async function getPublishableWorkouts(limit = FEED_PAGE_SIZE * 4): Promise<PublishableWorkout[]> {
  const { supabase, userId } = await requireUser();
  if (!userId) return [];

  const [{ data: logs, error: logsError }, { data: posted, error: postedError }] = await Promise.all([
    supabase
      .from("workout_logs")
      .select("id, date, modality, intensity_label, intensity_score, duration_min")
      .eq("user_id", userId)
      .neq("modality", "Descanso")
      .order("date", { ascending: false })
      .limit(limit),
    supabase.from("posts").select("workout_log_id").eq("user_id", userId),
  ]);

  if (logsError || postedError) {
    console.error("[getPublishableWorkouts] failed:", logsError ?? postedError);
    return [];
  }

  const used = new Set((posted ?? []).map((p) => p.workout_log_id as string));
  return ((logs ?? []) as PublishableWorkout[]).filter((log) => !used.has(log.id));
}

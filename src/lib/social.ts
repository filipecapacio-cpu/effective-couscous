import type { SupabaseClient } from "@supabase/supabase-js";
import type { IntensityLabel, WorkoutModality } from "@/lib/workoutLog";
import { APP_TIME_ZONE } from "@/lib/date";

/** Posts por página do feed. Mobile-first: cada card ocupa quase uma tela. */
export const FEED_PAGE_SIZE = 8;

/** Fotos por post — o mesmo limite está repetido na create_post_with_media(). */
export const MAX_POST_MEDIA = 4;
export const MAX_CAPTION_LENGTH = 500;
export const MAX_COMMENT_LENGTH = 300;
/** Mesmo teto do CHECK em social_profiles.bio. */
export const MAX_BIO_LENGTH = 160;

export const POST_MEDIA_BUCKET = "post-media";

/**
 * Validade das URLs assinadas das fotos. Uma hora é bem mais que o tempo de
 * uma sessão de scroll no feed, e curto o bastante pra um link copiado da
 * aba de rede não virar acesso permanente ao arquivo.
 */
export const SIGNED_URL_TTL_SECONDS = 3600;

export const HANDLE_PATTERN = /^[a-z0-9_]{3,20}$/;

/**
 * @ de Instagram e TikTok. Os mesmos CHECKs estão na migration 0024 — aqui
 * é só pra dar uma mensagem de erro decente antes de bater no banco.
 *
 * Guardamos só o @, nunca a URL: a URL é montada na hora de renderizar. É o
 * que impede colar um "javascript:..." num campo que vira link clicável no
 * perfil público.
 */
export const INSTAGRAM_PATTERN = /^[A-Za-z0-9._]{1,30}$/;
export const TIKTOK_PATTERN = /^[A-Za-z0-9._]{1,24}$/;

/**
 * Aceita o que a pessoa colar: "@fulano", "instagram.com/fulano",
 * "https://www.tiktok.com/@fulano" ou só "fulano" — e devolve sempre o @
 * limpo. Colar a URL inteira é o erro mais provável de todos, e recusar
 * isso com erro de validação seria hostil à toa.
 */
export function normalizeSocialHandle(raw: string): string {
  const trimmed = raw.trim();

  // Endereço do Instagram/TikTok: extrai o @ de dentro dele, descartando
  // barra final, query (?igsh=...) e fragmento.
  const withoutScheme = trimmed.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  const known = withoutScheme.match(/^(?:instagram\.com|tiktok\.com)\/@?([^/?#]+)/i);
  if (known) return known[1].trim();

  // Qualquer outra coisa é tratada como o @ digitado direto — e nenhum
  // pedaço é descartado. É o que faz "outrodominio.com/fulano" continuar
  // inteiro e ser RECUSADO pela validação, em vez de virar silenciosamente
  // o handle "outrodominio.com".
  return trimmed.replace(/^@/, "").trim();
}

export type SocialAuthor = {
  id: string;
  handle: string;
  display_name: string;
};

export type PostMedia = {
  storage_path: string;
  width: number | null;
  height: number | null;
  position: number;
  /** Preenchida no servidor por `signMedia()` — nunca vem do banco. */
  url?: string;
};

export type PostWorkout = {
  date: string;
  modality: WorkoutModality;
  intensity_label: IntensityLabel | null;
  intensity_score: number | null;
  duration_min: number | null;
};

export type PostComment = {
  id: string;
  body: string;
  created_at: string;
  author: SocialAuthor;
};

export type FeedPost = {
  id: string;
  caption: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  author: SocialAuthor;
  workout: PostWorkout;
  media: PostMedia[];
  /** Se o usuário da sessão já curtiu — resolvido numa query separada. */
  liked: boolean;
  /** Os últimos comentários, pra prévia no card do feed. */
  commentPreview: PostComment[];
};

/** Quantos comentários aparecem embaixo do card antes do "ver todos". */
export const COMMENT_PREVIEW_COUNT = 2;

export type FeedCursor = { createdAt: string; id: string };

export type FeedPage = {
  posts: FeedPost[];
  /** null quando acabaram os posts. */
  nextCursor: FeedCursor | null;
};

/**
 * Seleção usada nas duas telas que listam posts (feed e perfil público).
 * Os nomes de constraint (`posts_user_id_fkey`, `post_media_post_id_fkey`)
 * são o que desambigua o relacionamento pro PostgREST — `posts` tem FK pra
 * `social_profiles` e `post_comments` também tem, então sem o nome
 * explícito a query fica ambígua.
 */
const POST_SELECT = `
  id, caption, like_count, comment_count, created_at,
  author:social_profiles!posts_user_id_fkey (id, handle, display_name),
  workout:workout_logs!inner (date, modality, intensity_label, intensity_score, duration_min),
  media:post_media (storage_path, width, height, position)
`;

type Supabase = SupabaseClient;

/** Linha crua do PostgREST antes de virar FeedPost. */
type RawPost = Omit<FeedPost, "liked" | "commentPreview" | "author" | "workout" | "media"> & {
  author: SocialAuthor | SocialAuthor[] | null;
  workout: PostWorkout | PostWorkout[] | null;
  media: PostMedia[] | null;
};

/** Seleção de comentário com autor, usada na prévia e na tela do post. */
const COMMENT_SELECT =
  "id, post_id, body, created_at, author:social_profiles!post_comments_user_id_fkey (id, handle, display_name)";

/**
 * O PostgREST devolve relação "to-one" embutida como objeto, mas a tipagem
 * gerada nem sempre sabe disso e alguns embeds voltam como array de um
 * elemento. Normaliza os dois formatos.
 */
function one<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

/**
 * Gera as URLs assinadas das fotos de uma página inteira de posts numa
 * chamada só. Evita uma requisição de Storage por imagem — com 8 posts de
 * até 4 fotos isso seria até 32 round-trips por página.
 */
async function signMedia(supabase: Supabase, posts: FeedPost[]): Promise<void> {
  const paths = posts.flatMap((p) => p.media.map((m) => m.storage_path));
  if (paths.length === 0) return;

  const { data, error } = await supabase.storage
    .from(POST_MEDIA_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.error("[signMedia] failed:", error);
    return;
  }

  const byPath = new Map((data ?? []).map((row) => [row.path ?? "", row.signedUrl]));
  for (const post of posts) {
    for (const media of post.media) {
      media.url = byPath.get(media.storage_path) ?? undefined;
    }
  }
}

/** Marca quais posts da página o usuário da sessão já curtiu. Uma query só. */
async function markLiked(supabase: Supabase, posts: FeedPost[], userId: string | null): Promise<void> {
  if (!userId || posts.length === 0) return;

  const { data, error } = await supabase
    .from("post_likes")
    .select("post_id")
    .eq("user_id", userId)
    .in(
      "post_id",
      posts.map((p) => p.id)
    );

  if (error) {
    console.error("[markLiked] failed:", error);
    return;
  }

  const liked = new Set((data ?? []).map((row) => row.post_id as string));
  for (const post of posts) post.liked = liked.has(post.id);
}

/**
 * Últimos comentários dos posts de uma página, numa query só.
 *
 * "os N mais recentes de cada post" no banco pediria um LATERAL join, que o
 * PostgREST não expõe. Em vez disso pega os mais recentes da página inteira
 * com um teto fixo e agrupa em memória. O teto é o que mantém isso barato —
 * quando o volume crescer, o caminho é uma função SQL com LATERAL.
 */
async function attachCommentPreviews(supabase: Supabase, posts: FeedPost[]): Promise<void> {
  const withComments = posts.filter((p) => p.comment_count > 0);
  if (withComments.length === 0) return;

  const { data, error } = await supabase
    .from("post_comments")
    .select(COMMENT_SELECT)
    .in(
      "post_id",
      withComments.map((p) => p.id)
    )
    .order("created_at", { ascending: false })
    .limit(withComments.length * COMMENT_PREVIEW_COUNT * 4);

  if (error) {
    console.error("[attachCommentPreviews] failed:", error);
    return;
  }

  const byPost = new Map<string, PostComment[]>();
  for (const row of data ?? []) {
    const author = one((row as { author: SocialAuthor | SocialAuthor[] | null }).author);
    if (!author) continue;
    const postId = row.post_id as string;
    const list = byPost.get(postId) ?? [];
    if (list.length >= COMMENT_PREVIEW_COUNT) continue;
    list.push({
      id: row.id as string,
      body: row.body as string,
      created_at: row.created_at as string,
      author,
    });
    byPost.set(postId, list);
  }

  for (const post of posts) {
    // Vieram do mais novo pro mais antigo; na tela lê-se ao contrário.
    post.commentPreview = (byPost.get(post.id) ?? []).reverse();
  }
}

function toFeedPosts(rows: RawPost[]): FeedPost[] {
  return rows.flatMap((row) => {
    const author = one(row.author);
    const workout = one(row.workout);
    // Sem autor ou sem treino o card não tem o que mostrar. Não deveria
    // acontecer (as duas FKs são NOT NULL), mas descartar é melhor que
    // renderizar um card quebrado se algum dia acontecer.
    if (!author || !workout) return [];

    return [
      {
        id: row.id,
        caption: row.caption,
        like_count: row.like_count,
        comment_count: row.comment_count,
        created_at: row.created_at,
        author,
        workout,
        media: [...(row.media ?? [])].sort((a, b) => a.position - b.position),
        liked: false,
        commentPreview: [],
      },
    ];
  });
}

async function hydrate(
  supabase: Supabase,
  rows: RawPost[],
  viewerId: string | null
): Promise<FeedPage> {
  const posts = toFeedPosts(rows);
  // As três coisas são independentes entre si — não faz sentido esperar
  // uma pra começar a outra.
  await Promise.all([
    signMedia(supabase, posts),
    markLiked(supabase, posts, viewerId),
    attachCommentPreviews(supabase, posts),
  ]);

  const last = rows.length === FEED_PAGE_SIZE ? rows[rows.length - 1] : null;

  return {
    posts,
    nextCursor: last ? { createdAt: last.created_at, id: last.id } : null,
  };
}

/**
 * Uma página do feed aberto, mais recente primeiro.
 *
 * Paginação por keyset (`created_at`, `id`) em vez de offset: com offset,
 * qualquer post publicado enquanto a pessoa rola faz a página seguinte
 * repetir itens que ela já viu. O `id` como segundo critério é o que
 * desempata posts com o mesmo timestamp — sem ele, dois posts publicados no
 * mesmo instante poderiam sumir ou duplicar na virada de página.
 */
export async function getFeedPage(
  supabase: Supabase,
  viewerId: string | null,
  cursor: FeedCursor | null
): Promise<FeedPage> {
  let query = supabase
    .from("posts")
    .select(POST_SELECT)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(FEED_PAGE_SIZE);

  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("[getFeedPage] failed:", error);
    return { posts: [], nextCursor: null };
  }

  return hydrate(supabase, (data ?? []) as unknown as RawPost[], viewerId);
}

/** Posts de um atleta específico, para a tela de perfil público. */
export async function getAuthorPage(
  supabase: Supabase,
  authorId: string,
  viewerId: string | null,
  cursor: FeedCursor | null
): Promise<FeedPage> {
  let query = supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("user_id", authorId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(FEED_PAGE_SIZE);

  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("[getAuthorPage] failed:", error);
    return { posts: [], nextCursor: null };
  }

  return hydrate(supabase, (data ?? []) as unknown as RawPost[], viewerId);
}

/** Um post específico, para /social/post/[id]. */
export async function getPost(
  supabase: Supabase,
  postId: string,
  viewerId: string | null
): Promise<FeedPost | null> {
  const { data, error } = await supabase.from("posts").select(POST_SELECT).eq("id", postId).maybeSingle();

  if (error) {
    console.error("[getPost] failed:", error);
    return null;
  }
  if (!data) return null;

  const page = await hydrate(supabase, [data as unknown as RawPost], viewerId);
  return page.posts[0] ?? null;
}

export async function getComments(supabase: Supabase, postId: string): Promise<PostComment[]> {
  const { data, error } = await supabase
    .from("post_comments")
    .select(COMMENT_SELECT)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getComments] failed:", error);
    return [];
  }

  return (data ?? []).flatMap((row) => {
    const author = one((row as { author: SocialAuthor | SocialAuthor[] | null }).author);
    if (!author) return [];
    return [{ id: row.id as string, body: row.body as string, created_at: row.created_at as string, author }];
  });
}

/**
 * Identidade pública de quem está olhando. `null` significa que a pessoa
 * ainda não escolheu um @ — sem isso ela não pode publicar, curtir nem
 * comentar (posts.user_id tem FK pra social_profiles).
 */
export async function getViewer(supabase: Supabase, userId: string): Promise<SocialAuthor | null> {
  const { data, error } = await supabase
    .from("social_profiles")
    .select("id, handle, display_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[getViewer] failed:", error);
    return null;
  }
  return (data as SocialAuthor | null) ?? null;
}

export type PublicAuthor = SocialAuthor & {
  bio: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  created_at: string;
};

export async function getAuthorByHandle(
  supabase: Supabase,
  handle: string
): Promise<PublicAuthor | null> {
  const { data, error } = await supabase
    .from("social_profiles")
    .select("id, handle, display_name, bio, instagram_handle, tiktok_handle, created_at")
    .eq("handle", handle.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error("[getAuthorByHandle] failed:", error);
    return null;
  }
  return (data as PublicAuthor | null) ?? null;
}

/** Estatísticas simples do atleta, mostradas no topo do perfil público. */
export type AuthorStats = {
  posts: number;
  totalMinutes: number;
  topModality: WorkoutModality | null;
};

export async function getAuthorStats(supabase: Supabase, authorId: string): Promise<AuthorStats> {
  // Só treinos que viraram post são legíveis por outra pessoa (a policy
  // "workout_logs: select if published"), então esta estatística é
  // deliberadamente sobre o que foi publicado — não sobre o histórico
  // completo, que continua privado.
  const { data, error } = await supabase
    .from("posts")
    .select("workout:workout_logs!inner (modality, duration_min)")
    .eq("user_id", authorId);

  if (error) {
    console.error("[getAuthorStats] failed:", error);
    return { posts: 0, totalMinutes: 0, topModality: null };
  }

  const rows = (data ?? []).flatMap((row) => {
    const w = one((row as { workout: PostWorkout | PostWorkout[] | null }).workout);
    return w ? [w] : [];
  });

  const counts = new Map<WorkoutModality, number>();
  let totalMinutes = 0;
  for (const w of rows) {
    totalMinutes += w.duration_min ?? 0;
    counts.set(w.modality, (counts.get(w.modality) ?? 0) + 1);
  }

  let topModality: WorkoutModality | null = null;
  let topCount = 0;
  for (const [modality, count] of counts) {
    if (count > topCount) {
      topModality = modality;
      topCount = count;
    }
  }

  return { posts: rows.length, totalMinutes, topModality };
}

const DATE_FMT = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: APP_TIME_ZONE,
});

/** "14 SET" — mesmo formato curto que o card de compartilhamento já usa. */
export function formatWorkoutDate(dateISO: string): string {
  return DATE_FMT.format(new Date(`${dateISO}T12:00:00Z`))
    .replace(".", "")
    .toUpperCase();
}

/** "agora", "12 min", "3 h", "5 d" — tempo desde a publicação. */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const diffMs = now - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} sem`;
  return `${Math.floor(days / 30)} mes`;
}

/**
 * Sugere um handle a partir do nome (ou e-mail) que a pessoa já tem, pra
 * pré-preencher o campo em vez de mostrar uma caixa vazia. Pode colidir com
 * um handle existente — quem chama trata o erro de unicidade.
 */
export function suggestHandle(nameOrEmail: string): string {
  const base = nameOrEmail
    .split("@")[0]
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);

  if (base.length >= 3) return base;
  return `atleta_${Math.random().toString(36).slice(2, 8)}`;
}

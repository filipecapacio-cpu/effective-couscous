-- Onmode — feed social (posts de treino, curtidas e comentários)
-- Rode depois da 0021_profile_cpf_cnpj.sql, no SQL Editor do Supabase.
--
-- Regra central da feature: todo post é obrigatoriamente um treino que já
-- existe em public.workout_logs. Não existe post avulso — a FK NOT NULL
-- abaixo é o que garante isso no banco, não só na tela.
--
-- As métricas do treino (modalidade, intensidade, duração) NÃO são copiadas
-- pra cá: vêm por join com workout_logs na hora de montar o feed. Isso
-- mantém uma fonte da verdade só, com o efeito colateral consciente de que
-- editar o registro do dia muda o post já publicado (mesmo comportamento
-- que o Strava tem).

-- ── 1. Identidade pública ────────────────────────────────────────────────
--
-- Por que uma tabela nova em vez de abrir public.profiles pra leitura:
-- profiles guarda cpf_cnpj, asaas_customer_id, asaas_subscription_id e
-- checkout_url. RLS no Postgres é por LINHA, não por coluna — qualquer
-- policy de select que liberasse o nome do usuário pro feed liberaria
-- junto o CPF e os IDs de cobrança dele pra toda a base. Esta tabela
-- separa "o que é público" de "o que é da conta".

create table if not exists public.social_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  -- Só minúsculas, de propósito: o próprio CHECK é o que impede @Fulano e
  -- @fulano coexistirem como dois handles diferentes, sem precisar ligar a
  -- extensão citext só por causa disso.
  handle text not null unique check (handle ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  -- Reservado pra foto de perfil (Storage). A v1 ainda mostra só a inicial
  -- num círculo, igual a tela de Perfil já faz hoje.
  avatar_path text,
  bio text check (char_length(bio) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.social_profiles enable row level security;

create policy "social_profiles: select authenticated" on public.social_profiles
  for select to authenticated using (true);
create policy "social_profiles: insert own" on public.social_profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "social_profiles: update own" on public.social_profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- ── 2. Posts ─────────────────────────────────────────────────────────────
--
-- user_id aponta pra social_profiles (e não direto pra auth.users) por dois
-- motivos: (a) obriga ter identidade pública antes de publicar qualquer
-- coisa, (b) dá ao PostgREST a chave estrangeira que ele precisa pra
-- embutir o autor na mesma query do feed, num round-trip só. A cascata até
-- auth.users continua existindo, via social_profiles -> profiles.

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.social_profiles (id) on delete cascade,
  -- NOT NULL + UNIQUE: sem treino não existe post, e um treino vira no
  -- máximo um post (evita 10 publicações do mesmo treino).
  workout_log_id uuid not null unique references public.workout_logs (id) on delete cascade,
  caption text check (char_length(caption) <= 500),
  -- Contadores denormalizados, mantidos pelos gatilhos da seção 6. Sem
  -- eles o feed faria um count() por post a cada página carregada.
  like_count int not null default 0,
  comment_count int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "posts: select authenticated" on public.posts
  for select to authenticated using (true);
create policy "posts: insert own" on public.posts
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "posts: update own" on public.posts
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "posts: delete own" on public.posts
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ── 3. Fotos do post ─────────────────────────────────────────────────────

create table if not exists public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  storage_path text not null unique,
  width int,
  height int,
  position int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.post_media enable row level security;

create policy "post_media: select authenticated" on public.post_media
  for select to authenticated using (true);
create policy "post_media: insert own post" on public.post_media
  for insert to authenticated with check (
    exists (select 1 from public.posts p where p.id = post_id and p.user_id = (select auth.uid()))
  );

-- Sem policy de UPDATE nem de DELETE, de propósito: com RLS ligada e
-- nenhuma policy pra uma operação, o cliente simplesmente não consegue
-- executá-la. É o que impede alguém apagar as fotos e deixar no ar um post
-- publicado sem imagem nenhuma. Apagar o post inteiro continua funcionando
-- normalmente — a cascata do ON DELETE roda pelo sistema e não passa por
-- RLS.

-- ── 4. Curtidas ──────────────────────────────────────────────────────────

create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.social_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- A chave composta já é a restrição de "uma curtida por pessoa por post".
  primary key (post_id, user_id)
);

alter table public.post_likes enable row level security;

create policy "post_likes: select authenticated" on public.post_likes
  for select to authenticated using (true);
create policy "post_likes: insert own" on public.post_likes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "post_likes: delete own" on public.post_likes
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ── 5. Comentários ───────────────────────────────────────────────────────
-- Sem parent_id: a v1 não tem resposta aninhada.

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.social_profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 300),
  created_at timestamptz not null default now()
);

alter table public.post_comments enable row level security;

create policy "post_comments: select authenticated" on public.post_comments
  for select to authenticated using (true);
create policy "post_comments: insert own" on public.post_comments
  for insert to authenticated with check ((select auth.uid()) = user_id);

-- Apagar comentário: o autor dele OU o dono do post. O segundo caso é o que
-- deixa a pessoa moderar a própria publicação enquanto não existe um
-- sistema de denúncia de verdade.
create policy "post_comments: delete own or post owner" on public.post_comments
  for delete to authenticated using (
    (select auth.uid()) = user_id
    or exists (select 1 from public.posts p where p.id = post_id and p.user_id = (select auth.uid()))
  );

-- ── 6. Contadores ────────────────────────────────────────────────────────
--
-- security definer é obrigatório aqui: quem curte não é o dono do post, e a
-- policy "posts: update own" barraria o UPDATE do contador se o gatilho
-- rodasse com as permissões de quem chamou.

create or replace function public.sync_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$fn$;

create or replace function public.sync_post_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$fn$;

drop trigger if exists sync_post_like_count_trigger on public.post_likes;
create trigger sync_post_like_count_trigger
  after insert or delete on public.post_likes
  for each row execute function public.sync_post_like_count();

drop trigger if exists sync_post_comment_count_trigger on public.post_comments;
create trigger sync_post_comment_count_trigger
  after insert or delete on public.post_comments
  for each row execute function public.sync_post_comment_count();

-- Função de gatilho não precisa estar exposta na API (mesmo cuidado já
-- tomado com handle_new_user() e protect_billing_columns()).
revoke execute on function public.sync_post_like_count() from anon, authenticated, public;
revoke execute on function public.sync_post_comment_count() from anon, authenticated, public;

-- ── 7. Leitura do treino publicado ───────────────────────────────────────
--
-- Esta é a peça que faz o feed conseguir mostrar as métricas. A policy
-- "workout_logs: all own" (0009_security_and_performance.sql) continua
-- valendo e é o que mantém o histórico de treinos privado. O que esta
-- policy adiciona é uma janela estreita: a linha de workout_logs fica
-- legível pros outros usuários logados SE, e somente se, o próprio dono
-- publicou um post apontando pra ela. Apagou o post, a janela fecha na
-- mesma hora. As colunas expostas são só modalidade, intensidade, duração
-- e data — exatamente o que o post mostra na tela.

create policy "workout_logs: select if published" on public.workout_logs
  for select to authenticated using (
    exists (select 1 from public.posts p where p.workout_log_id = workout_logs.id)
  );

-- ── 8. Seguir (estrutura pronta, sem uso na v1) ──────────────────────────
--
-- O feed da v1 é aberto e NÃO consulta esta tabela. Ela existe agora só pra
-- que a v2 de perfil/seguir seja uma troca de query, e não uma migration de
-- tabela nova com índices em cima de uma base já cheia de dados em
-- produção. Nenhuma tela usa isso ainda.

create table if not exists public.follows (
  follower_id uuid not null references public.social_profiles (id) on delete cascade,
  following_id uuid not null references public.social_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

alter table public.follows enable row level security;

create policy "follows: select authenticated" on public.follows
  for select to authenticated using (true);
create policy "follows: insert own" on public.follows
  for insert to authenticated with check ((select auth.uid()) = follower_id);
create policy "follows: delete own" on public.follows
  for delete to authenticated using ((select auth.uid()) = follower_id);

-- ── 9. Índices ───────────────────────────────────────────────────────────

-- Paginação por keyset do feed (order by created_at desc, id desc).
create index if not exists idx_posts_created_at_id on public.posts (created_at desc, id desc);
-- Posts de um atleta, na tela de perfil público.
create index if not exists idx_posts_user_created on public.posts (user_id, created_at desc, id desc);
create index if not exists idx_post_media_post_position on public.post_media (post_id, position);
create index if not exists idx_post_likes_user on public.post_likes (user_id);
create index if not exists idx_post_comments_post_created on public.post_comments (post_id, created_at);
create index if not exists idx_post_comments_user on public.post_comments (user_id);
create index if not exists idx_follows_following on public.follows (following_id);
-- A policy da seção 7 avalia `posts.workout_log_id = workout_logs.id` pra
-- cada linha; sem este índice ela vira seq scan em posts.
create index if not exists idx_posts_workout_log on public.posts (workout_log_id);

-- ── 10. Criação transacional do post ─────────────────────────────────────
--
-- Duas coisas que só dá pra garantir aqui dentro, e não com policy:
--
-- 1. Posse do treino. A policy "posts: insert own" só confere que user_id é
--    você — ela NÃO impede você de inserir um post seu apontando pro
--    workout_log_id de outra pessoa. O primeiro IF abaixo é o que fecha
--    esse buraco.
-- 2. "Todo post tem pelo menos uma foto". Post e fotos entram na mesma
--    transação: ou os dois existem, ou nenhum existe. Sem isso haveria uma
--    janela real em que um post recém-criado aparece no feed sem imagem.
--
-- security invoker (que já é o padrão, explicitado aqui pra deixar claro
-- que é intencional): a função roda com a RLS de quem chamou, então ela não
-- vira um caminho alternativo pra furar as policies das seções acima.

create or replace function public.create_post_with_media(
  p_workout_log_id uuid,
  p_caption text,
  p_media jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $fn$
declare
  v_user uuid := (select auth.uid());
  v_post_id uuid;
  v_media_count int;
begin
  if v_user is null then
    raise exception 'Não autenticado.' using errcode = '28000';
  end if;

  -- "Descanso" não vira post: não há treino nenhum pra mostrar.
  if not exists (
    select 1 from public.workout_logs wl
    where wl.id = p_workout_log_id
      and wl.user_id = v_user
      and wl.modality <> 'Descanso'
  ) then
    raise exception 'Treino inválido ou não pertence a você.' using errcode = '42501';
  end if;

  v_media_count := coalesce(jsonb_array_length(p_media), 0);
  if v_media_count < 1 or v_media_count > 4 then
    raise exception 'Um post precisa de 1 a 4 fotos.' using errcode = '22023';
  end if;

  insert into public.posts (user_id, workout_log_id, caption)
  values (v_user, p_workout_log_id, nullif(btrim(coalesce(p_caption, '')), ''))
  returning id into v_post_id;

  insert into public.post_media (post_id, storage_path, width, height, position)
  select
    v_post_id,
    m ->> 'storage_path',
    nullif(m ->> 'width', '')::int,
    nullif(m ->> 'height', '')::int,
    (ord - 1)::int
  from jsonb_array_elements(p_media) with ordinality as t(m, ord);

  -- Mesma regra da policy de Storage, repetida aqui no banco: o caminho tem
  -- que começar pela pasta do próprio usuário. Impede registrar no seu post
  -- um arquivo que está na pasta de outra pessoa.
  if exists (
    select 1 from public.post_media pm
    where pm.post_id = v_post_id
      and split_part(pm.storage_path, '/', 1) <> v_user::text
  ) then
    raise exception 'Caminho de imagem inválido.' using errcode = '42501';
  end if;

  return v_post_id;
end;
$fn$;

grant execute on function public.create_post_with_media(uuid, text, jsonb) to authenticated;

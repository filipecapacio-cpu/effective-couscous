-- Onmode — bucket de Storage das fotos do feed social
-- Rode depois da 0022_social_feed.sql.
--
-- Este é o PRIMEIRO uso de Supabase Storage no projeto — até aqui nenhuma
-- tela do Onmode subia arquivo nenhum.
--
-- Se o SQL Editor recusar os CREATE POLICY abaixo com erro de permissão em
-- storage.objects (acontece em alguns projetos, dependendo de quando foram
-- criados), dá pra criar as mesmas três regras pela interface, em
-- Storage -> Policies -> bucket post-media. A lógica está comentada em cada
-- uma.

-- ── 1. O bucket ──────────────────────────────────────────────────────────
--
-- public = false de propósito. Bucket público serve qualquer arquivo por
-- URL adivinhável, sem login — a foto de treino de um usuário vazaria pra
-- fora do app. Privado + URL assinada de curta duração (gerada no servidor
-- a cada página do feed) mantém o conteúdo dentro da base logada.
--
-- file_size_limit de 5 MB é folga: o app comprime toda imagem pra WebP de
-- no máximo 1440px antes de subir (src/lib/image.ts), o que na prática dá
-- 200-350 KB por foto. O limite aqui é só a rede de proteção contra alguém
-- chamando a API de Storage direto, por fora do app.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media',
  'post-media',
  false,
  5242880,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ── 2. Policies ──────────────────────────────────────────────────────────
--
-- Layout de caminho: {user_id}/{grupo}/{arquivo}.webp
-- A primeira pasta ser o uuid do usuário é o que torna a regra de posse
-- verificável tanto aqui quanto na função create_post_with_media().

-- Escrita: só dentro da própria pasta.
drop policy if exists "post-media: insert own folder" on storage.objects;
create policy "post-media: insert own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Leitura: qualquer usuário logado, porque o feed é aberto. É o que permite
-- ao servidor assinar as URLs das fotos de todo mundo pra montar a página.
drop policy if exists "post-media: select authenticated" on storage.objects;
create policy "post-media: select authenticated" on storage.objects
  for select to authenticated
  using (bucket_id = 'post-media');

-- Remoção: só dentro da própria pasta. Usado pela limpeza de upload
-- abandonado e ao apagar um post.
drop policy if exists "post-media: delete own folder" on storage.objects;
create policy "post-media: delete own folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- Sem policy de UPDATE: um arquivo já publicado não é sobrescrito. Trocar a
-- foto de um post significa apagar o post e publicar de novo.

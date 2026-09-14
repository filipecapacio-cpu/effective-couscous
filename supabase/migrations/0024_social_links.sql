-- Onmode — @ do Instagram e do TikTok no perfil público
-- Rode depois da 0023_social_storage.sql, no SQL Editor do Supabase.
--
-- Migration puramente aditiva: duas colunas novas e anuláveis. Nenhuma linha
-- existente é tocada e nada quebra se o código antigo continuar rodando por
-- um instante antes do deploy.
--
-- Guardamos só o @, nunca a URL inteira. A URL é montada na hora de
-- renderizar (instagram.com/<handle>). É o que impede alguém colar um
-- "javascript:..." ou um link pra qualquer outro lugar num campo que vira
-- link clicável no perfil público — o CHECK abaixo não deixa passar nada
-- além de letras, números, ponto e underscore.

alter table public.social_profiles
  -- Instagram: até 30 caracteres, letras/números/ponto/underscore.
  add column if not exists instagram_handle text
    check (instagram_handle ~ '^[A-Za-z0-9._]{1,30}$'),
  -- TikTok: até 24 caracteres, mesmo conjunto.
  add column if not exists tiktok_handle text
    check (tiktok_handle ~ '^[A-Za-z0-9._]{1,24}$');

-- Sem policy nova: social_profiles já tem "select authenticated" (todo mundo
-- logado lê o perfil público) e "update own" (só o dono edita). As duas
-- colunas entram debaixo dessas mesmas regras.
--
-- Vale notar que isto é informação que a pessoa escolhe tornar pública, e
-- fica legível pra qualquer usuário logado — igual ao nome e à bio. Não é
-- lugar pra nada sensível, e a tela deixa claro que é opcional.

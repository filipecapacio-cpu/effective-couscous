# Onmode

Alta performance que cabe na rotina. Treino, nutrição e recuperação em um
só lugar, pensado pra quem também estuda ou trabalha.

Stack: [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind
CSS v4, com [Supabase](https://supabase.com) para autenticação e dados.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Sem o backend
configurado (próxima seção), a landing page e o onboarding funcionam
normalmente — as telas que dependem de conta (`/dashboard`, `/plano`,
`/perfil`, `/entrar`, `/cadastro`) mostram um aviso explicando o que falta
configurar, em vez de quebrar.

## Configurando o backend (Supabase)

1. Crie um projeto grátis em [supabase.com](https://supabase.com).
2. No **SQL Editor** do projeto, rode o conteúdo de
   [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql).
   Isso cria as tabelas (`profiles`, `workouts`, `workout_exercises`,
   `meals`) com Row Level Security — cada pessoa só acessa os próprios
   dados.
3. Em **Project Settings → API**, copie a **Project URL** e a chave
   **anon/public**.
4. Copie `.env.local.example` para `.env.local` e preencha os dois
   valores:

   ```bash
   cp .env.local.example .env.local
   ```

5. Reinicie o servidor (`npm run dev`).

A partir daí, cadastro/login, o plano do dia e o resumo semanal passam a
persistir de verdade por usuário.

> Por padrão, projetos novos no Supabase exigem confirmação por e-mail no
> cadastro. Pra testar mais rápido em desenvolvimento, isso pode ser
> desligado em **Authentication → Providers → Email → Confirm email**.

Depois do 0001, também rode
[`0002_profile_goal_and_editing.sql`](./supabase/migrations/0002_profile_goal_and_editing.sql)
e [`0003_ai_assistant.sql`](./supabase/migrations/0003_ai_assistant.sql), na
ordem, no mesmo SQL Editor.

## Configurando o assistente de IA (opcional)

Sem isso o app funciona normal — só a anamnese, o plano gerado por IA e o
chat do assistente (`/assistente`) ficam desativados, com um aviso em vez
de quebrar.

1. Crie uma conta em [console.anthropic.com](https://console.anthropic.com)
   e adicione algum crédito.
2. Em **Settings → API Keys**, gere uma chave nova.
3. Adicione ao `.env.local`:

   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

4. Reinicie o servidor. Cada plano gerado ou mensagem no chat consome
   crédito da sua conta Anthropic (modelo usado: Claude Opus 5).

## Conectando wearables (Garmin, opcional)

Sem isso o app funciona normal — só a seção "Wearable" do Perfil (disponível
nos planos Pro e Elite) fica desativada.

A conexão usa a [Terra API](https://tryterra.co): ela hospeda a tela de
login com a Garmin (o Onmode nunca vê a senha do usuário) e depois empurra
sono, FC de repouso, body battery e estresse via webhook.

1. **Atenção, isso tem custo**: a Terra não tem plano gratuito de verdade —
   os planos pagos começam em ~US$400/mês (só reembolso em 30 dias se não
   servir, sem free tier permanente). Confirme em
   [tryterra.co/pricing](https://tryterra.co/pricing) antes de criar conta,
   e só vale a pena com receita de assinantes que já cubra esse custo.
2. Pegue seu `dev_id` e sua `x-api-key` no painel e adicione ao
   `.env.local`:

   ```
   TERRA_DEV_ID=
   TERRA_API_KEY=
   ```

3. Rode [`supabase/migrations/0017_wearables.sql`](./supabase/migrations/0017_wearables.sql)
   no SQL Editor do seu projeto Supabase (depois das migrations anteriores).
4. No painel da Terra, configure o destino do webhook apontando pra
   `https://<seu-domínio>/api/webhooks/terra` (em produção; em
   desenvolvimento local isso exige expor a porta 3000, ex. com `ngrok`).
   A Terra mostra um signing secret ao criar o destino — copie pra
   `TERRA_SIGNING_SECRET` no `.env.local` (e nas envs da Vercel). **Sem
   isso configurado corretamente, qualquer um poderia postar dados falsos
   nesse endpoint** — o webhook valida a assinatura HMAC do header
   `terra-signature` antes de processar qualquer payload.
5. Reinicie o servidor. O botão "Conectar Garmin" no Perfil passa a abrir
   o widget hospedado da Terra.

### Testando em sandbox

A Terra tem um provider de teste com dados simulados de sono, atividade e
desconexão — vale conectar e observar os payloads reais chegando em
`/api/webhooks/terra` (um `console.log` temporário no handler ajuda) antes
de confiar cegamente no mapeamento de campos em `src/app/api/webhooks/terra/route.ts`
— em especial "body battery", que é um recurso proprietário da Garmin sem
um campo unificado 100% confirmado na documentação da Terra.

## Feed social

Área social dentro do app (`/social`): cada publicação é obrigatoriamente um
treino que a pessoa já registrou em `workout_logs`, com pelo menos uma foto
anexada. Feed aberto a qualquer usuário logado — não existe "seguir" na v1,
e não há nenhuma checagem de plano: Free, Pro e Elite publicam igual.

1. Rode, no SQL Editor do Supabase e nessa ordem:
   [`0022_social_feed.sql`](./supabase/migrations/0022_social_feed.sql)
   (tabelas, RLS e a função `create_post_with_media`) e depois
   [`0023_social_storage.sql`](./supabase/migrations/0023_social_storage.sql)
   (bucket `post-media` e as policies de Storage).
2. Confira em **Storage** que o bucket `post-media` apareceu e está
   **privado**. Se os `CREATE POLICY` da 0023 tiverem falhado por permissão
   em `storage.objects` (acontece em alguns projetos), crie as três regras
   pela interface em Storage → Policies — a lógica de cada uma está
   comentada no arquivo.
3. Nenhuma variável de ambiente nova é necessária.

Pontos que valem saber ao mexer nisso:

- **As métricas do post vêm por join, não por cópia.** O post guarda só a
  legenda e a referência ao treino; modalidade, duração e intensidade são
  lidas de `workout_logs` na hora de montar o feed. A consequência é que
  editar o registro daquele dia muda o post já publicado (mesmo
  comportamento do Strava). Lembre que `workout_logs` tem
  `unique (user_id, date)` e é sobrescrito por upsert.
- **Privacidade do histórico.** A policy `workout_logs: select if published`
  libera pra leitura só as linhas que têm um post apontando pra elas. O
  resto do histórico de treino continua privado, inclusive nas estatísticas
  do perfil público.
- **`public.profiles` não é legível por outros usuários** e não deve virar —
  ela guarda `cpf_cnpj` e os IDs da Asaas. O que é público mora em
  `social_profiles` (handle, nome, bio).
- **Imagens.** São comprimidas no navegador (`src/lib/image.ts`) pra WebP de
  no máximo 1440px antes de subir, e servidas por URL assinada de 1h. Não
  passam pelo `next/image` de propósito — o otimizador trataria cada
  assinatura como uma imagem nova.

O que ainda não existe (consciente, não esquecido): moderação e denúncia de
conteúdo, sistema de seguir (a tabela `follows` já está criada mas nenhuma
tela usa), notificações, foto de perfil, edição de post e uma rotina de
limpeza pros arquivos de upload abandonado no meio da criação de um post.

## Estrutura

- `src/app/` — páginas (App Router): landing (`/`), `onboarding`,
  `cadastro`, `entrar`, `dashboard`, `plano`, `perfil`, `anamnese`,
  `assistente`, `social` (feed, `/social/novo`, `/social/post/[id]`) e
  `atleta/[handle]` (perfil público).
- `src/app/actions/` — Server Actions (auth, plano, perfil, IA, social).
- `src/components/social/` — feed, card de post, criação de publicação e
  perfil público.
- `src/lib/social.ts` — tipos, paginação por keyset e queries do feed.
- `src/lib/image.ts` — compressão de imagem no navegador antes do upload.
- `src/lib/supabase/` — clientes Supabase (browser, server, middleware) e
  o helper `isSupabaseConfigured()`.
- `src/lib/anthropic.ts` — cliente da API da Anthropic e
  `isAnthropicConfigured()`.
- `src/lib/plan.ts` / `src/lib/data.ts` — conteúdo do plano inicial e
  cálculo de sequência/consistência.
- `src/lib/ai-plan.ts` / `src/lib/anamnesis.ts` — schema do plano gerado
  por IA e tipos da anamnese.
- `src/lib/terra.ts` — cliente da Terra API (widget de conexão, histórico,
  verificação de assinatura) e `isTerraConfigured()`.
- `src/lib/wearables.ts` — leitura da `wearable_data` e cálculo da
  prontidão (combina Garmin com os registros manuais de treino).
- `src/app/api/webhooks/` — endpoints que recebem eventos assíncronos do
  Asaas (pagamentos) e da Terra (dados de wearable).
- `supabase/migrations/` — schema do banco.

## Scripts

- `npm run dev` — servidor de desenvolvimento.
- `npm run build` — build de produção.
- `npm run lint` — ESLint.

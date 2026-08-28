# Pulso

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

## Estrutura

- `src/app/` — páginas (App Router): landing (`/`), `onboarding`,
  `cadastro`, `entrar`, `dashboard`, `plano`, `perfil`, `anamnese`,
  `assistente`.
- `src/app/actions/` — Server Actions (auth, plano, perfil, IA).
- `src/lib/supabase/` — clientes Supabase (browser, server, middleware) e
  o helper `isSupabaseConfigured()`.
- `src/lib/anthropic.ts` — cliente da API da Anthropic e
  `isAnthropicConfigured()`.
- `src/lib/plan.ts` / `src/lib/data.ts` — conteúdo do plano inicial e
  cálculo de sequência/consistência.
- `src/lib/ai-plan.ts` / `src/lib/anamnesis.ts` — schema do plano gerado
  por IA e tipos da anamnese.
- `supabase/migrations/` — schema do banco.

## Scripts

- `npm run dev` — servidor de desenvolvimento.
- `npm run build` — build de produção.
- `npm run lint` — ESLint.

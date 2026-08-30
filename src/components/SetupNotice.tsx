export default function SetupNotice() {
  return (
    <div className="mx-auto w-full max-w-lg px-6 py-16 flex flex-col gap-4">
      <div className="text-[13px] font-mono tracking-[0.1em] uppercase text-ink-soft font-semibold">
        Configuração pendente
      </div>
      <h1 className="font-display font-bold uppercase tracking-[-0.02em] text-3xl">Falta ligar o backend.</h1>
      <p className="text-ink-soft text-[15px] leading-relaxed">
        Essa tela precisa de uma conta e de dados salvos, então precisa do
        Supabase configurado:
      </p>
      <ol className="text-[15px] leading-relaxed text-ink-soft list-decimal pl-5 flex flex-col gap-1.5">
        <li>Crie um projeto grátis em supabase.com.</li>
        <li>
          No SQL Editor do projeto, rode o arquivo{" "}
          <code className="bg-card px-1.5 py-0.5 rounded text-ink text-sm">
            supabase/migrations/0001_init.sql
          </code>{" "}
          deste repositório.
        </li>
        <li>
          Copie a Project URL e a chave anon (Project Settings → API) para um
          arquivo <code className="bg-card px-1.5 py-0.5 rounded text-ink text-sm">.env.local</code>{" "}
          na raiz do projeto — o formato está em{" "}
          <code className="bg-card px-1.5 py-0.5 rounded text-ink text-sm">.env.local.example</code>.
        </li>
        <li>Reinicie o servidor (<code className="bg-card px-1.5 py-0.5 rounded text-ink text-sm">npm run dev</code>).</li>
      </ol>
    </div>
  );
}

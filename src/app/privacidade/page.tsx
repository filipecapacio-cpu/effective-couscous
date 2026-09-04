import Link from "next/link";
import { Logo } from "@/components/Logo";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display font-bold uppercase tracking-[-0.01em] text-xl">{title}</h2>
      <div className="flex flex-col gap-3 text-[16px] leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

export default function PrivacidadePage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16 flex flex-col gap-10 min-h-svh">
      <Link href="/">
        <Logo className="text-2xl" />
      </Link>

      <div className="flex flex-col gap-3">
        <h1 className="font-display font-bold uppercase tracking-[-0.02em] text-4xl md:text-5xl leading-[1.05]">
          Política de Privacidade
        </h1>
        <p className="text-ink-faint text-sm">Última atualização: 4 de setembro de 2026</p>
      </div>

      <div className="flex flex-col gap-8">
        <Section title="1. Introdução e controlador">
          <p>
            Esta Política de Privacidade explica como a Onmode coleta, usa, compartilha e protege
            seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº
            13.709/2018, &quot;LGPD&quot;).{" "}
            <strong>Fluxo Criativo</strong>, operada por Filipe Pancieri e Arthur Picanço, com
            sede em Belém-PA{" "}
            <span className="text-ink-faint">
              (razão social e CNPJ serão atualizados aqui assim que a empresa for formalizada)
            </span>
            , é a controladora dos dados pessoais tratados através do aplicativo Onmode.
          </p>
        </Section>

        <Section title="2. Quais dados coletamos">
          <p>
            <strong>Dados de cadastro:</strong> nome, e-mail e senha (armazenada de forma
            criptografada — a Onmode nunca tem acesso à sua senha em texto puro).
          </p>
          <p>
            <strong>Dados de saúde da anamnese</strong> (preenchimento opcional, necessário apenas
            para usar o assistente de IA): idade, sexo, altura, peso atual, peso-meta, nível de
            atividade física, dias disponíveis por semana, local de treino, nível de experiência,
            lesões ou condições de saúde relatadas, restrições alimentares e observações que você
            escrever livremente. Esses são <strong>dados sensíveis</strong> nos termos do art. 5º,
            II, da LGPD, e recebem tratamento reforçado, descrito no item 3 abaixo.
          </p>
          <p>
            <strong>Dados de uso do app:</strong> treinos e refeições que você registra, metas
            semanais e seu histórico de consistência.
          </p>
          <p>
            <strong>Mensagens do assistente de IA:</strong> o conteúdo que você envia no chat e as
            respostas geradas.
          </p>
          <p>
            <strong>Dados de pagamento:</strong> nome e e-mail, enviados ao nosso processador de
            pagamentos para criar sua cobrança. A Onmode não recebe nem armazena dados do seu cartão
            de crédito — isso é feito diretamente pelo processador de pagamentos (item 4).
          </p>
          <p>
            <strong>Dados técnicos:</strong> apenas o cookie de sessão que mantém você conectado à
            sua conta.
          </p>
        </Section>

        <Section title="3. Base legal e finalidade de cada tratamento">
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>
              <strong>Execução de contrato:</strong> dados de cadastro e de pagamento, para criar e
              manter sua conta e processar sua assinatura.
            </li>
            <li>
              <strong>Consentimento específico</strong> (art. 11 da LGPD): os dados de saúde da
              anamnese só são coletados e usados com seu consentimento, exclusivamente para gerar
              seu plano de treino e dieta personalizado. Você pode retirar esse consentimento a
              qualquer momento apagando ou deixando de preencher a anamnese — isso desativa o
              assistente de IA, sem afetar o restante da sua conta.
            </li>
            <li>
              <strong>Cumprimento de obrigação legal:</strong> guarda de registros de cobrança
              exigidos pela legislação fiscal.
            </li>
            <li>
              <strong>Legítimo interesse:</strong> medidas de segurança e prevenção a fraude.
            </li>
          </ul>
        </Section>

        <Section title="4. Com quem compartilhamos seus dados">
          <p>Compartilhamos dados apenas com prestadores de serviço que operam a Onmode:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>
              <strong>Supabase</strong> — banco de dados e autenticação, onde seus dados ficam
              armazenados.
            </li>
            <li>
              <strong>Anthropic</strong> — fornece o modelo de inteligência artificial usado pelo
              assistente. Recebe o conteúdo da sua anamnese e das mensagens de chat para gerar as
              respostas e planos.
            </li>
            <li>
              <strong>Asaas</strong> — processa os pagamentos das assinaturas Pro e Elite; recebe seu
              nome e e-mail.
            </li>
            <li>
              <strong>Vercel</strong> — hospeda a aplicação.
            </li>
          </ul>
          <p>Não vendemos seus dados pessoais a terceiros, nem os usamos para fins publicitários.</p>
        </Section>

        <Section title="5. Transferência internacional de dados">
          <p>
            Alguns desses prestadores (como a Anthropic) podem processar dados fora do Brasil. Essa
            transferência é feita com base nas salvaguardas contratuais desses fornecedores e apenas
            na medida necessária para o funcionamento do assistente de IA.
          </p>
        </Section>

        <Section title="6. Por quanto tempo guardamos seus dados">
          <p>
            Mantemos seus dados enquanto sua conta estiver ativa. Se você excluir sua conta,
            apagamos ou anonimizamos seus dados pessoais em prazo razoável, exceto informações que a
            lei exija que mantenhamos por mais tempo (como registros fiscais de cobrança).
          </p>
        </Section>

        <Section title="7. Seus direitos">
          <p>Nos termos do art. 18 da LGPD, você pode a qualquer momento:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>Confirmar a existência de tratamento e acessar seus dados;</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
            <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários;</li>
            <li>Solicitar a portabilidade dos seus dados;</li>
            <li>Solicitar a eliminação dos dados tratados com base no seu consentimento;</li>
            <li>Obter informações sobre com quem compartilhamos seus dados;</li>
            <li>Revogar seu consentimento a qualquer momento.</li>
          </ul>
          <p>
            Nome e meta semanal podem ser editados direto em <em>Perfil</em>, e sua anamnese pode ser
            apagada ou reescrita a qualquer momento em <em>Anamnese e plano com IA</em>. Para
            qualquer outro pedido, incluindo exclusão total da conta, entre em contato com{" "}
            <a href="mailto:suporteonmode@gmail.com" className="underline underline-offset-2">
              suporteonmode@gmail.com
            </a>
            .
          </p>
        </Section>

        <Section title="8. Segurança">
          <p>
            Adotamos medidas técnicas e administrativas razoáveis para proteger seus dados, como
            senha armazenada de forma criptografada, controle de acesso e conexão criptografada
            (HTTPS) em toda a aplicação. Nenhum sistema é totalmente infalível; caso ocorra um
            incidente de segurança que possa gerar risco relevante aos seus dados, notificaremos
            você e a Autoridade Nacional de Proteção de Dados (ANPD) conforme exigido pela LGPD.
          </p>
        </Section>

        <Section title="9. Menores de idade">
          <p>A Onmode não é destinada a menores de 18 anos e não coleta intencionalmente dados de menores.</p>
        </Section>

        <Section title="10. Cookies">
          <p>
            Usamos apenas o cookie estritamente necessário para manter sua sessão logada. A Onmode
            não usa cookies de rastreamento ou publicidade.
          </p>
        </Section>

        <Section title="11. Alterações desta Política">
          <p>
            Podemos atualizar esta Política de tempos em tempos. Alterações relevantes serão
            comunicadas por e-mail ou por aviso dentro do app antes de entrarem em vigor.
          </p>
        </Section>

        <Section title="12. Contato">
          <p>
            Dúvidas sobre esta Política ou sobre o tratamento dos seus dados? Fale com a gente em{" "}
            <a href="mailto:suporteonmode@gmail.com" className="underline underline-offset-2">
              suporteonmode@gmail.com
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}

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

export default function TermosPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16 flex flex-col gap-10 min-h-svh">
      <Link href="/">
        <Logo className="text-2xl" />
      </Link>

      <div className="flex flex-col gap-3">
        <h1 className="font-display font-bold uppercase tracking-[-0.02em] text-4xl md:text-5xl leading-[1.05]">
          Termos de Uso
        </h1>
        <p className="text-ink-faint text-sm">Última atualização: 4 de setembro de 2026</p>
      </div>

      <div className="flex flex-col gap-8">
        <Section title="1. Sobre estes Termos">
          <p>
            Estes Termos de Uso regulam o acesso e o uso do aplicativo Onmode (&quot;Onmode&quot;,
            &quot;nós&quot;, &quot;nosso&quot;), disponibilizado por{" "}
            <strong>Filipe Pancieri e Arthur Picanço</strong>, com sede em Belém-PA{" "}
            <span className="text-ink-faint">
              (razão social e CNPJ serão atualizados aqui assim que a empresa for formalizada)
            </span>
            . Ao criar uma conta ou usar a Onmode, você concorda com estes Termos e com a nossa{" "}
            <Link href="/privacidade" className="underline underline-offset-2">
              Política de Privacidade
            </Link>
            . Se você não concorda com qualquer parte destes Termos, não crie uma conta nem utilize
            a Onmode.
          </p>
        </Section>

        <Section title="2. O que é a Onmode">
          <p>
            A Onmode é um aplicativo de treino, nutrição e performance. No plano Free você organiza
            e acompanha treinos e refeições manualmente. Nos planos Pro e Elite, um assistente de
            inteligência artificial gera um plano semanal de treino e dieta personalizado a partir
            das respostas que você fornece na anamnese, e permite ajustar esse plano por chat.
          </p>
        </Section>

        <Section title="3. Conta e cadastro">
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>Você precisa ter 18 anos ou mais para criar uma conta na Onmode.</li>
            <li>Os dados fornecidos no cadastro devem ser verdadeiros, completos e mantidos atualizados.</li>
            <li>
              Você é responsável por manter sua senha em sigilo e por toda atividade realizada na sua
              conta.
            </li>
            <li>
              Podemos suspender ou encerrar contas em caso de uso indevido, fraude, ou violação
              destes Termos.
            </li>
          </ul>
        </Section>

        <Section title="4. Planos, preços e cobrança">
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>O plano Free é gratuito e dá acesso às funcionalidades básicas do app.</li>
            <li>
              Os planos Pro e Elite são pagos, cobrados mensal ou anualmente, nos valores exibidos na
              tela de assinatura no momento da contratação.
            </li>
            <li>
              Todo plano pago inclui 7 dias de teste grátis: a primeira cobrança só ocorre depois
              desse período.
            </li>
            <li>
              A cobrança recorrente é processada pela Asaas Gestão Financeira (
              <a href="https://www.asaas.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                asaas.com
              </a>
              ), nosso processador de pagamentos. A Onmode não recebe nem armazena o número do seu
              cartão de crédito — isso é tratado diretamente pela Asaas.
            </li>
          </ul>
        </Section>

        <Section title="5. Cancelamento e reembolso">
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>
              Você pode cancelar sua assinatura a qualquer momento, diretamente pelo app, em{" "}
              <em>Perfil → Assinatura → Cancelar assinatura</em>.
            </li>
            <li>
              O cancelamento interrompe qualquer cobrança futura e encerra o acesso ao plano pago
              imediatamente.
            </li>
            <li>
              Valores já pagos não são reembolsados proporcionalmente ao período não utilizado, com
              exceção do direito de arrependimento previsto no art. 49 do Código de Defesa do
              Consumidor: se você cancelar dentro de 7 dias corridos a contar da contratação do
              plano pago, tem direito ao estorno integral de eventual valor já cobrado. Para
              solicitar esse estorno, entre em contato com{" "}
              <a href="mailto:suporteonmode@gmail.com" className="underline underline-offset-2">
                suporteonmode@gmail.com
              </a>
              .
            </li>
          </ul>
        </Section>

        <Section title="6. Conteúdo gerado por IA e uso responsável">
          <p>
            Os planos de treino e dieta gerados pelo assistente de IA são criados automaticamente
            com base nas informações que você mesmo forneceu na anamnese. Eles{" "}
            <strong>não substituem</strong> a avaliação, o diagnóstico ou o acompanhamento de um
            médico, nutricionista ou educador físico.
          </p>
          <p>
            Recomendamos fortemente consultar um profissional de saúde antes de iniciar qualquer
            programa de exercício físico ou mudança alimentar, especialmente se você tiver alguma
            condição de saúde preexistente, lesão ou restrição alimentar. A Onmode não se
            responsabiliza por lesões, complicações de saúde ou resultados decorrentes do uso das
            recomendações geradas pelo app.
          </p>
        </Section>

        <Section title="7. Conduta do usuário">
          <p>Ao usar a Onmode, você concorda em não:</p>
          <ul className="list-disc pl-5 flex flex-col gap-1.5">
            <li>Usar o app para fins ilícitos ou fraudulentos;</li>
            <li>Tentar acessar dados ou contas de outros usuários;</li>
            <li>Fazer engenharia reversa, copiar ou reproduzir o app ou seu código;</li>
            <li>Sobrecarregar deliberadamente o assistente de IA ou a infraestrutura do app.</li>
          </ul>
        </Section>

        <Section title="8. Propriedade intelectual">
          <p>
            A marca Onmode, seu logotipo, layout, textos e código-fonte são de titularidade da
            Onmode e/ou de seus licenciantes, protegidos pela legislação de propriedade intelectual
            aplicável. Nada nestes Termos transfere a você qualquer direito sobre essa propriedade,
            além da licença limitada e revogável de uso do app para fins pessoais.
          </p>
        </Section>

        <Section title="9. Disponibilidade e alterações do serviço">
          <p>
            Fazemos o possível para manter a Onmode disponível e funcionando corretamente, mas o
            serviço é fornecido &quot;como está&quot;, sem garantia de disponibilidade contínua ou
            ininterrupta. Podemos alterar, suspender ou descontinuar funcionalidades a qualquer
            momento, avisando com antecedência razoável sempre que a mudança afetar
            significativamente sua assinatura.
          </p>
        </Section>

        <Section title="10. Limitação de responsabilidade">
          <p>
            Na máxima extensão permitida pela lei, a Onmode não se responsabiliza por danos
            indiretos, incidentais ou consequenciais decorrentes do uso ou da impossibilidade de uso
            do app, incluindo — mas não se limitando a — resultados de treino ou nutrição, perda de
            dados ou interrupções do serviço.
          </p>
        </Section>

        <Section title="11. Alterações destes Termos">
          <p>
            Podemos atualizar estes Termos de tempos em tempos. Alterações relevantes serão
            comunicadas por e-mail ou por aviso dentro do app antes de entrarem em vigor. O uso
            continuado da Onmode após a alteração significa que você concorda com os novos termos.
          </p>
        </Section>

        <Section title="12. Lei aplicável e foro">
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o
            foro da comarca de <strong>Belém, Pará</strong> para dirimir quaisquer controvérsias,
            com renúncia a qualquer outro, por mais privilegiado que seja, ressalvado o foro do
            domicílio do consumidor, quando aplicável.
          </p>
        </Section>

        <Section title="13. Contato">
          <p>
            Dúvidas sobre estes Termos? Fale com a gente em{" "}
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

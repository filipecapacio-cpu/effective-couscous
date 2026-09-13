import { z } from "zod";

/**
 * Schema e prompt do Leitor de Conversa. Separado de "leitor-conversa.ts"
 * (que só tem constantes) de propósito: a tela é um componente de cliente e
 * não deveria carregar o zod nem o prompt de sistema pro navegador.
 */

export const AnaliseSchema = z.object({
  conversa_legivel: z
    .boolean()
    .describe(
      "true se dá pra ler a conversa e distinguir quem mandou cada mensagem. false se a imagem não é uma conversa, está ilegível ou não dá pra separar os lados."
    ),
  aviso: z
    .string()
    .describe(
      "Quando conversa_legivel for false, explique em 1 ou 2 frases o que impediu a leitura. Quando for true, use string vazia - ou uma ressalva curta, se alguma parte do print ficou ambígua."
    ),
  clima: z.object({
    engajamento: z
      .enum(["alto", "neutro", "baixo"])
      .describe("Nível de interesse aparente da outra pessoa, com base só no que está visível."),
    resumo: z
      .string()
      .describe("2 a 3 frases sobre como está o clima da conversa, em tom de hipótese."),
    sinais: z
      .array(
        z.object({
          sinal: z.string().describe("O que é observável no print, em até 6 palavras."),
          leitura: z.string().describe("O que esse sinal pode indicar. Uma frase."),
        })
      )
      .min(2)
      .max(5)
      .describe("De 2 a 5 sinais concretos: tamanho das respostas, quem puxa assunto, perguntas de volta, emojis, tempo de resposta."),
  }),
  atencao: z
    .array(
      z.object({
        titulo: z.string().describe("O erro ou risco, em até 6 palavras."),
        detalhe: z.string().describe("Por que isso atrapalha aqui. Uma ou duas frases."),
      })
    )
    .min(1)
    .max(4)
    .describe("De 1 a 4 pontos de atenção sobre a forma de conversar de quem mandou o print."),
  direcoes: z
    .array(
      z.object({
        caminho: z.string().describe("A direção possível, em até 8 palavras. Nunca a mensagem pronta."),
        porque: z.string().describe("O raciocínio por trás dessa direção e quando ela faz sentido."),
      })
    )
    .min(2)
    .max(3)
    .describe("De 2 a 3 caminhos possíveis pra próxima mensagem."),
});

export type Analise = z.infer<typeof AnaliseSchema>;

export const SYSTEM_PROMPT = `Você é um analista de comunicação que ajuda pessoas a entenderem melhor o tom de uma
conversa e a se comunicarem de forma mais autêntica e respeitosa. Você NÃO fornece frases
prontas, técnicas de manipulação, persuasão forçada, nem incentiva desonestidade. Seu foco
é ajudar a pessoa a ler sinais sociais e se comunicar com mais clareza e confiança.

## O que você recebe
Um ou mais prints de conversa de app de mensagem, na ordem em que foram enviados. Leia
cada print de cima pra baixo e trate o conjunto como uma linha do tempo só.

## Quem é quem
Na maioria dos apps, as mensagens alinhadas à direita (balão colorido) são de quem tirou
o print - chame essa pessoa de "você". As da esquerda são da outra pessoa. Se o print não
deixar isso claro, diga no campo "aviso" em vez de chutar. Nunca suponha gênero,
orientação ou tipo de relação: fale sempre em "a outra pessoa".

## Como analisar
- Sinais observáveis: tamanho das respostas de cada lado, quem puxa assunto, se a outra
  pessoa devolve perguntas, tempo entre mensagens (quando o print mostra horário),
  emojis e risadas, se ela desenvolve o assunto ou responde em monossílabos.
- Um print é um recorte pequeno e sem contexto. Fale sempre em hipótese ("parece", "pode
  indicar"), nunca em certeza, e não invente nada que não esteja na imagem.
- O engajamento é uma leitura de padrões, não um veredito sobre a pessoa.

## Direções
De 2 a 3 caminhos possíveis pra próxima mensagem (por exemplo: aprofundar um assunto que
ela trouxe, mudar de assunto, dar espaço), cada um com o raciocínio por trás. NUNCA
escreva a mensagem pronta nem um exemplo de frase entre aspas - a ideia é que a pessoa
escreva com as palavras dela.

## Limites
- Nada de conteúdo sexual, de sedução forçada, de "técnica" pra vencer resistência, nem
  nada que trate a outra pessoa como alvo a ser conquistado.
- Se os prints mostram a outra pessoa desconfortável, pedindo espaço, encerrando o
  assunto ou sem responder, a leitura honesta é essa - e a direção saudável é respeitar,
  não tentar outra abordagem pra insistir.
- Se a imagem não for uma conversa, estiver ilegível ou não der pra separar os lados,
  marque conversa_legivel como false e explique no aviso.

Escreva em português do Brasil, direto, sem jargão de coach e sem bajulação.`;

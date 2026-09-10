# Template Padrão de Carrossel — @filipe_capacio

Prompt mestre a ser usado (ou adaptado) toda vez que um novo carrossel for gerado para o perfil.

---

Crie um carrossel de Instagram de 9 slides, formato 1080x1350px (4:5), seguindo rigorosamente este sistema visual:

**Paleta de cores:**
- Fundo escuro primário: #0d0e10
- Fundo escuro secundário (alternância entre slides): #1c1d20
- Cor de destaque (dourado/âmbar): #c9963c
- Texto principal: #f4f2ee (quase branco)
- Texto secundário: #a7aab0 (cinza claro)
- Texto terciário/legendas de rodapé: #5e6167 (cinza escuro)
- Slide de CTA final: fundo sólido #c9963c com texto escuro #14100a

**Tipografia:**
- Títulos e frases de impacto: 'Libre Caslon Display' (serifada), tamanhos entre 66-98px, line-height 1.1-1.22
- Texto de apoio/subtítulos: 'Archivo' (sans-serif), peso 400-500, tamanhos 38-46px
- Labels/categorias (ex: 'CICLO 01', 'LIFESTYLE'): Archivo, 26px, letter-spacing 0.34em, uppercase, cor dourada
- Numeração de rodapé (ex: '01 / 09'): Archivo, 24px, letter-spacing 0.3em, cor #5e6167

**Elementos estruturais:**
- Linha dourada fina (120x2px) como marcador de início de bloco de texto em slides de transição
- Padding padrão de 96px em todos os slides
- Slide de capa: label com hífen dourado (——) + categoria do pilar do dia (ex: LIFESTYLE, DISCIPLINA, KARATÊ), frase de impacto centralizada, 'ARRASTE →' no rodapé
- Slides com foto: imagem ocupa painel lateral direito (460px de largura, 100% de altura), com gradiente de transição suave pro fundo escuro (evita corte abrupto), filtro sutil (grayscale 15%, contrast 1.08, brightness 1.02) pra manter consistência tonal com a paleta
- Slides só-texto: fundo liso ou com textura sutil (linhas diagonais cruzadas em baixa opacidade, ou pontilhado), sem elementos gráficos que compitam com o texto
- Slide de CTA final: sempre no fundo dourado sólido, texto escuro, call-to-action claro (pedir comentário com palavra-chave específica, não genérico)

**Regras de composição:**
- Nunca mais de 2 fotos consecutivas — alternar com slides só-texto pra dar respiro
- Fotos sempre à direita, texto sempre à esquerda (nunca inverter, mantém previsibilidade de marca)
- Numeração de progresso (0X/09) sempre no canto inferior esquerdo em slides com foto, ou centralizada/lateral em slides só-texto
- Categoria/pilar do conteúdo identificado no topo do slide 1 e repetido como 'CICLO 0X' ou label temático nos slides de transição

Esse é o template mestre do perfil — aplicar em todo carrossel futuro, ajustando apenas o texto, as fotos e o pilar de conteúdo (Karatê, Performance, Disciplina ou Lifestyle).

---

## Pilares de conteúdo do perfil
1. Karatê Shotokan (técnica, competição, filosofia)
2. Performance esportiva (treino, força, condicionamento)
3. Disciplina e desenvolvimento pessoal
4. Lifestyle de atleta (rotina, bastidores)

## Exemplos já gerados
- `exemplos/carrossel_ciclos.html` — pilar Disciplina/Lifestyle (ciclos de vida: vestibular + trabalho com internet)
- `exemplos/carrossel_estudo_trabalho.html` — pilar Lifestyle (bastidores de estudo/trabalho)

## Como visualizar os exemplos
Cada arquivo em `exemplos/` é um HTML autocontido com os 9 slides do carrossel, renderizados lado a lado em 1080x1350px (role horizontalmente ou abra em um navegador e tire print de cada slide individualmente). Os painéis marcados "FOTO" são placeholders — substitua pelo asset real do atleta antes de publicar, mantendo o painel de 460px à direita e o filtro tonal (grayscale 15%, contrast 1.08, brightness 1.02) descrito acima.

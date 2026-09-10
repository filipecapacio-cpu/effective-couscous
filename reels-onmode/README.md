# Reels Onmode — sistema de edição cinematográfica

Pipeline que transforma gravações de tela do app em reels 9:16 com a
identidade Onmode. Gera dois cortes a partir do mesmo material:

| Arquivo | Duração | Ideia |
|---|---|---|
| `out/onmode-reel-01.mp4` | 16,2s | Narrativa completa: o plano gerado por IA → registrar → compartilhar |
| `out/onmode-reel-02.mp4` | 12,3s | Corte curto e direto: "treino registrado em 10 segundos" |

**Entrega:** 1080x1920, 30fps, H.264 High, `+faststart`, com faixa de áudio
**muda** — a trilha entra por cima no próprio Instagram (é o que preserva o
alcance de áudio em alta). As gravações originais já vinham sem som.

## Identidade aplicada

Vem de `src/app/globals.css` e `src/app/layout.tsx` — é a identidade do **app**,
não a do perfil pessoal (`carrossel-instagram/`, que é dourado + serifada).

- Fundo `#0a0a0a` · acento lima `#d7ff3e` · texto `#fafafa` · fios `#262626`
- Títulos: **Archivo** 800, caixa alta, `letter-spacing` negativo
- Labels/kickers: **IBM Plex Mono**, `letter-spacing: .34em`, caixa alta, com o
  ponto lima antes — o mesmo "• ONMODE" que aparece no card de compartilhar
- Apoio: **IBM Plex Sans**
- Textura hachurada a 2,8% de opacidade, citando o `.onmode-hatch` do app
- Moldura fina com cantos lima em todos os planos (assinatura cinematográfica
  consistente do começo ao fim)

## Gramática visual

Três tipos de plano se alternam pra criar ritmo:

- **hero** — tela cheia (recorte `1170x2080` → `1080x1920`) com *push-in* lento.
  Estabelece "isto é um app de verdade".
- **insert** — recorte fechado emoldurado sobre preto com fio lima. Plano de
  detalhe: os campos, o botão. É onde a leitura acontece.
- **card de título** — só tipografia, com entrada cinética (sobe + revela por
  `clip-path`, escalonada linha a linha).

Grade: contraste 1.10, saturação 1.12, curva em S suavizada, sombras levemente
frias e altas puxadas pro lima, *bloom* por `blend=screen`, grão e vinheta.

## Roteiro

**Reel 01** — hook → plano do dia → registro → salvar → card → assinatura

1. `VOCÊ ESTUDA. / VOCÊ TRABALHA. / E AINDA TREINA.`
2. *(aberto)* Seu plano do dia
3. `O TREINO DE HOJE / JÁ VEM PRONTO.` — kicker "PLANO GERADO POR IA"
4. `VOCÊ SÓ MARCA / O QUE FEZ.`
5. `UM TOQUE.`
6. *(sem texto)* "Salvando…" → o card aparece, com flash lima no corte
7. `E JÁ SAI / PRONTO PRA POSTAR.` — entra só a 1,9s, depois do card respirar
8. `ONMODE` + tagline + `LINK NA BIO`

**Reel 02** — `TREINO REGISTRADO / EM 10 SEGUNDOS.` → `ESCOLHE. MARCA.` →
salvar → `SEU TREINO / VIRA STORY.` → assinatura.

## Como regerar

```bash
export SRC_A=/caminho/gravacao-plano-do-dia.mp4      # tela "Seu plano do dia"
export SRC_B=/caminho/gravacao-registro-treino.mp4   # registro + card
./build.sh
```

Precisa de `ffmpeg` (com `libx264`), `node` e `python3`. O script baixa as
fontes na primeira execução (`fetch-fonts.sh`) e instala o `playwright`, que
renderiza a tipografia no Chromium — é o que garante Archivo de verdade, com
kerning e acentuação corretos, em vez do `drawtext` do ffmpeg.

Variáveis opcionais: `FF` (caminho do ffmpeg), `CHROME` (Chromium já instalado).

Tudo que o script gera é ignorado pelo git — só o pipeline é versionado.

## Notas de quem editou

- **Os timecodes em `build.sh` são das gravações originais.** Trocando o
  material, os recortes precisam ser remedidos.
- **A gravação A é quase toda inaproveitável**: tela de início, erro de Safari
  ("iPhone não está conectado à internet"), pastas de apps e vários segundos de
  preto. Só os últimos ~1,5s mostram o app (16,65s→18,15s). Como a tela é
  estática, o plano é construído a partir de um quadro congelado com *push-in* —
  fica mais limpo do que esticar 1,5s de vídeo.
- **Os primeiros 160px são a barra de status do iOS** (relógio e a pílula
  vermelha de gravação). Todo recorte começa abaixo disso; a pílula nunca
  aparece no corte final.
- **O teclado do iOS ocupa metade da tela** entre 0s e ~6,2s da gravação B. Por
  isso o trecho de digitação só existe como *insert* fechado nos campos, acima
  da linha do teclado.
- **O `blend` do bloom precisa rodar em RGB.** Em YUV ele mexe nos planos de
  croma e joga um magenta nos brancos da UI — o botão "Salvar registro" ficava
  rosa. Daí o `format=gbrp` antes do `split`.
- **Imagem estática precisa de `-framerate 30` na entrada.** O padrão do
  demuxer de imagem é 25fps, e sem isso todo plano com `zoompan` sai 17% mais
  curto que o pedido.
- **Áreas seguras do Instagram**: o rodapé em mono fica a 170px da base pra não
  sumir atrás da legenda; os títulos ficam na faixa central.
- **CTA é "LINK NA BIO"** porque o projeto ainda não tem domínio próprio (ver o
  TODO em `src/app/layout.tsx`). Quando existir, trocar em `render_art.mjs`.

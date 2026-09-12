/* ==========================================================================
   Ashford — catálogo
   Fonte única dos produtos: home, categoria, produto e carrinho leem daqui.
   Pra adicionar peça nova, copie um bloco e troque os campos — a loja inteira
   se atualiza sozinha.

   As imagens em img/ são ilustrações provisórias. Pra usar as fotos reais,
   troque os arquivos mantendo os nomes (ou aponte "fotos" pros novos).
   ========================================================================== */

var ASHFORD_CATEGORIAS = [
  {
    slug: "pulseiras",
    nome: "Pulseiras",
    chamada: "Couro, aço e cordão náutico. Peças que envelhecem bem.",
    capa: "img/capa-pulseiras.svg",
  },
  {
    slug: "oculos",
    nome: "Óculos",
    chamada: "Armações clássicas, lente polarizada, proteção UV400.",
    capa: "img/capa-oculos.svg",
  },
  {
    slug: "bones",
    nome: "Bonés",
    chamada: "Algodão lavado e sarja, em tons que combinam com tudo.",
    capa: "img/capa-bones.svg",
  },
];

var ASHFORD_PRODUTOS = [
  /* ---------------------------------- Pulseiras --------------------------- */
  {
    slug: "pulseira-marlin",
    nome: "Pulseira Marlin",
    categoria: "pulseiras",
    preco: 189,
    destaque: true,
    resumo: "Couro italiano trançado à mão, fecho em aço banhado.",
    descricao:
      "Trançado fechado em couro legítimo curtido a vegetal, com fecho em aço inoxidável banhado a ouro velho. O couro escurece com o uso — em um ano, a peça é sua e de mais ninguém.",
    detalhes: [
      "Couro italiano curtido a vegetal",
      "Fecho em aço inoxidável com banho de ouro velho",
      "Resistente à água doce; evite contato prolongado com o mar",
      "Largura de 8 mm",
    ],
    variacoes: [
      { titulo: "Cor", opcoes: ["Marinho", "Castanho", "Preto"] },
      { titulo: "Tamanho", opcoes: ["P (17 cm)", "M (19 cm)", "G (21 cm)"] },
    ],
    fotos: ["img/pulseira-marlin-1.svg", "img/pulseira-marlin-2.svg", "img/pulseira-marlin-3.svg"],
  },
  {
    slug: "pulseira-regatta",
    nome: "Pulseira Regatta",
    categoria: "pulseiras",
    preco: 149,
    destaque: false,
    resumo: "Cordão náutico bicolor, fecho em aço escovado.",
    descricao:
      "Herança direta dos clubes de vela: cordão náutico trançado em dois tons, com fecho magnético em aço escovado. Leve o bastante pra esquecer que está usando.",
    detalhes: [
      "Cordão náutico em poliéster trançado",
      "Fecho magnético em aço escovado",
      "Pode molhar — seca sem marcar",
      "Largura de 6 mm",
    ],
    variacoes: [
      { titulo: "Cor", opcoes: ["Creme e marinho", "Marinho e verde", "Creme e caramelo"] },
      { titulo: "Tamanho", opcoes: ["P (17 cm)", "M (19 cm)", "G (21 cm)"] },
    ],
    fotos: ["img/pulseira-regatta-1.svg", "img/pulseira-regatta-2.svg", "img/pulseira-regatta-3.svg"],
  },
  {
    slug: "pulseira-signature",
    nome: "Pulseira Signature",
    categoria: "pulseiras",
    preco: 229,
    destaque: true,
    resumo: "Ônix fosco e medalha do brasão em ouro velho.",
    descricao:
      "Contas de ônix natural em acabamento fosco, interrompidas por uma única medalha com o brasão da casa. É a peça mais discreta do catálogo — e a que mais escuta perguntas.",
    detalhes: [
      "Contas de ônix natural de 10 mm",
      "Medalha em latão com banho de ouro velho",
      "Elástico duplo de alta resistência",
      "Feita à mão, uma a uma",
    ],
    variacoes: [
      { titulo: "Pedra", opcoes: ["Ônix fosco", "Hematita", "Madeira de ébano"] },
      { titulo: "Tamanho", opcoes: ["P (17 cm)", "M (19 cm)", "G (21 cm)"] },
    ],
    fotos: ["img/pulseira-signature-1.svg", "img/pulseira-signature-2.svg", "img/pulseira-signature-3.svg"],
  },
  {
    slug: "pulseira-whitfield",
    nome: "Pulseira Whitfield",
    categoria: "pulseiras",
    preco: 259,
    destaque: false,
    resumo: "Elos de aço escovado, fecho com assinatura da casa.",
    descricao:
      "Elos ovais em aço inoxidável escovado, sem brilho de vitrine. Fecho dobrável com a assinatura gravada por dentro — visível só pra quem usa.",
    detalhes: [
      "Aço inoxidável 316L escovado",
      "Fecho dobrável com trava de segurança",
      "Não escurece nem mancha a pele",
      "Ajustável: removemos elos sob pedido",
    ],
    variacoes: [
      { titulo: "Acabamento", opcoes: ["Aço escovado", "Ouro velho", "Grafite"] },
      { titulo: "Tamanho", opcoes: ["M (19 cm)", "G (21 cm)"] },
    ],
    fotos: ["img/pulseira-whitfield-1.svg", "img/pulseira-whitfield-2.svg", "img/pulseira-whitfield-3.svg"],
  },

  /* ----------------------------------- Óculos ----------------------------- */
  {
    slug: "oculos-belmont",
    nome: "Óculos Belmont",
    categoria: "oculos",
    preco: 449,
    destaque: true,
    resumo: "Aviador em ouro velho, lente verde polarizada.",
    descricao:
      "O aviador clássico, sem o brilho espelhado que entrega a década. Armação em metal com banho de ouro velho e lente verde polarizada — a que menos altera as cores do que você está vendo.",
    detalhes: [
      "Lente polarizada com proteção UV400",
      "Armação em metal leve com banho de ouro velho",
      "Plaquetas de silicone ajustáveis",
      "Acompanha estojo rígido e flanela",
    ],
    variacoes: [
      { titulo: "Armação", opcoes: ["Ouro velho", "Prata escovada", "Grafite"] },
      { titulo: "Lente", opcoes: ["Verde G15", "Marrom", "Cinza"] },
    ],
    fotos: ["img/oculos-belmont-1.svg", "img/oculos-belmont-2.svg", "img/oculos-belmont-3.svg"],
  },
  {
    slug: "oculos-cavendish",
    nome: "Óculos Cavendish",
    categoria: "oculos",
    preco: 399,
    destaque: true,
    resumo: "Acetato tartaruga, formato quadrado suavizado.",
    descricao:
      "Acetato italiano em padrão tartaruga, cortado em bloco e polido a tambor. Formato quadrado de cantos suaves: equilibra rosto fino sem pedir licença.",
    detalhes: [
      "Acetato italiano Mazzucchelli",
      "Lente polarizada com proteção UV400",
      "Dobradiças com mola",
      "Acompanha estojo rígido e flanela",
    ],
    variacoes: [
      { titulo: "Armação", opcoes: ["Tartaruga", "Âmbar", "Preto fosco"] },
      { titulo: "Lente", opcoes: ["Marrom", "Verde G15", "Cinza"] },
    ],
    fotos: ["img/oculos-cavendish-1.svg", "img/oculos-cavendish-2.svg", "img/oculos-cavendish-3.svg"],
  },
  {
    slug: "oculos-thatcher",
    nome: "Óculos Thatcher",
    categoria: "oculos",
    preco: 429,
    destaque: false,
    resumo: "Redondo em metal fino, lente âmbar.",
    descricao:
      "Redondo de aro fino, do tipo que aparece em foto antiga de biblioteca. Metal leve, lente âmbar que aquece a luz do fim de tarde.",
    detalhes: [
      "Aro fino em metal leve",
      "Lente polarizada com proteção UV400",
      "Ponte ajustável",
      "Acompanha estojo rígido e flanela",
    ],
    variacoes: [
      { titulo: "Armação", opcoes: ["Ouro velho", "Prata escovada"] },
      { titulo: "Lente", opcoes: ["Âmbar", "Verde G15", "Cinza"] },
    ],
    fotos: ["img/oculos-thatcher-1.svg", "img/oculos-thatcher-2.svg", "img/oculos-thatcher-3.svg"],
  },
  {
    slug: "oculos-harrow",
    nome: "Óculos Harrow",
    categoria: "oculos",
    preco: 379,
    destaque: false,
    resumo: "Acetato preto fosco, desenho retangular sóbrio.",
    descricao:
      "Preto fosco, retangular, sem logo à vista. É o par que resolve o dia inteiro — do trajeto de manhã ao almoço fora.",
    detalhes: [
      "Acetato preto em acabamento fosco",
      "Lente polarizada com proteção UV400",
      "Hastes com alma de metal",
      "Acompanha estojo rígido e flanela",
    ],
    variacoes: [
      { titulo: "Armação", opcoes: ["Preto fosco", "Cinza fumê"] },
      { titulo: "Lente", opcoes: ["Cinza", "Verde G15"] },
    ],
    fotos: ["img/oculos-harrow-1.svg", "img/oculos-harrow-2.svg", "img/oculos-harrow-3.svg"],
  },

  /* ----------------------------------- Bonés ------------------------------ */
  {
    slug: "bone-crest",
    nome: "Boné Crest",
    categoria: "bones",
    preco: 169,
    destaque: true,
    resumo: "Sarja bege com o brasão bordado em marinho.",
    descricao:
      "Sarja de algodão pesado em bege, com o brasão bordado em ponto fechado. Aba curva pré-moldada e fecho de fivela em metal — nada de plástico.",
    detalhes: [
      "100% algodão, sarja de 320 g",
      "Brasão bordado em ponto fechado",
      "Fecho de fivela em metal escovado",
      "Aba curva pré-moldada",
    ],
    variacoes: [{ titulo: "Cor", opcoes: ["Bege", "Areia", "Off-white"] }],
    fotos: ["img/bone-crest-1.svg", "img/bone-crest-2.svg", "img/bone-crest-3.svg"],
  },
  {
    slug: "bone-regatta",
    nome: "Boné Regatta",
    categoria: "bones",
    preco: 169,
    destaque: false,
    resumo: "Marinho fechado, brasão em ouro velho.",
    descricao:
      "Marinho profundo com o brasão em fio dourado envelhecido. O boné que funciona com camisa de linho e com moletom cinza, sem parecer que mudou de time.",
    detalhes: [
      "100% algodão, sarja de 320 g",
      "Bordado em fio de ouro velho",
      "Fecho de fivela em metal escovado",
      "Aba curva pré-moldada",
    ],
    variacoes: [{ titulo: "Cor", opcoes: ["Marinho", "Grafite"] }],
    fotos: ["img/bone-regatta-1.svg", "img/bone-regatta-2.svg", "img/bone-regatta-3.svg"],
  },
  {
    slug: "bone-chatham",
    nome: "Boné Chatham",
    categoria: "bones",
    preco: 179,
    destaque: true,
    resumo: "Algodão lavado verde-oliva, caimento macio.",
    descricao:
      "Algodão lavado em tinta natural: sai da caixa já com aquele caimento de peça usada há dois verões. Verde-oliva puxando pro acinzentado.",
    detalhes: [
      "Algodão lavado, tingimento natural",
      "Copa desestruturada, caimento macio",
      "Bordado tom sobre tom",
      "Fecho de fivela em metal escovado",
    ],
    variacoes: [{ titulo: "Cor", opcoes: ["Verde-oliva", "Caramelo", "Marinho lavado"] }],
    fotos: ["img/bone-chatham-1.svg", "img/bone-chatham-2.svg", "img/bone-chatham-3.svg"],
  },
  {
    slug: "bone-oxford",
    nome: "Boné Oxford",
    categoria: "bones",
    preco: 159,
    destaque: false,
    resumo: "Cinza-claro, sem bordado à frente.",
    descricao:
      "Cinza-claro liso, com a assinatura só na etiqueta interna. Pra quem prefere que nada no boné fale antes da pessoa.",
    detalhes: [
      "100% algodão, sarja de 320 g",
      "Sem bordado frontal; assinatura interna",
      "Fecho de fivela em metal escovado",
      "Aba curva pré-moldada",
    ],
    variacoes: [{ titulo: "Cor", opcoes: ["Cinza-claro", "Off-white"] }],
    fotos: ["img/bone-oxford-1.svg", "img/bone-oxford-2.svg", "img/bone-oxford-3.svg"],
  },
];

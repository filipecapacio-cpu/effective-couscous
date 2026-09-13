# Ashford — loja de acessórios masculinos

Site de e-commerce da **Ashford** (pulseiras, óculos de sol e bonés), em
HTML/CSS/JS puro — sem build, sem framework, sem dependência de servidor.
Abre direto no navegador e sobe em qualquer hospedagem estática.

Estética old money: marinho `#1C2B3A`, creme `#F5F1E8` e ouro velho `#8A6D3A`;
[Playfair Display](https://fonts.google.com/specimen/Playfair+Display) nos
títulos e [Inter](https://fonts.google.com/specimen/Inter) no texto corrido,
carregadas do Google Fonts — a única dependência externa das páginas.

```
ashford/
├── index.html        Home: capa, categorias, destaques, manifesto, Instagram
├── categoria.html    Grade da categoria (?c=pulseiras|oculos|bones)
├── produto.html      Página da peça (?id=slug)
├── sobre.html        História, valores e propósito
├── contato.html      Contato + FAQ (entrega, trocas, pagamento, tamanhos)
├── carrinho.html     Sacola e checkout
├── css/style.css
├── js/
│   ├── config.js     Contato, pagamento e frete — comece por aqui
│   ├── catalogo.js   Produtos e categorias
│   ├── loja.js       Carrinho, formatação e o que toda página usa
│   └── paginas.js    Comportamento de cada página
└── img/              Fotos de produto (ilustrações provisórias)
```

## Rodando localmente

Qualquer servidor estático serve. Com Python:

```bash
cd ashford
python3 -m http.server 8000
```

E abra <http://localhost:8000>. (Abrir o `index.html` com dois cliques também
funciona, mas o `file://` deixa o carrinho sem `localStorage` em alguns
navegadores — prefira o servidor.)

## Configuração

Tudo que muda com o tempo está em [`js/config.js`](./js/config.js):

```js
whatsapp: "5591992477891",   // país + DDD + número, só dígitos
instagram: "ashford_accessories",
email: "clubashford@gmail.com",
pixChave: "clubashford@gmail.com",
pixDesconto: 0.05,           // 5% no Pix; use 0 pra não dar desconto
cartaoLink: "",              // link de pagamento do gateway (ver abaixo)
frete: 24.9,
freteGratisAcima: 299,
```

O número do WhatsApp vale pros links de dúvida, pro rodapé e pro envio do
pedido — trocar em um lugar troca no site inteiro. O mesmo para
Instagram, e-mail, frete e desconto do Pix.

## Catálogo

Cada peça é um objeto em [`js/catalogo.js`](./js/catalogo.js):

```js
{
  slug: "pulseira-marlin",        // vira a URL: produto.html?id=pulseira-marlin
  nome: "Pulseira Marlin",
  categoria: "pulseiras",
  preco: 189,
  destaque: true,                  // aparece na home
  resumo: "...",                   // uma linha, na grade
  descricao: "...",                // parágrafo, na página da peça
  detalhes: ["...", "..."],        // lista do acordeão
  variacoes: [{ titulo: "Cor", opcoes: ["Marinho", "Castanho"] }],
  fotos: ["img/pulseira-marlin-1.svg", "..."],
}
```

Home, categoria, produto, "você também pode gostar" e carrinho leem daí —
nenhum HTML precisa ser editado pra incluir, tirar ou repreçar uma peça.

### Fotos

As imagens em `img/` são **ilustrações vetoriais provisórias**, feitas pra o
site ficar completo antes das fotos reais existirem. Quando as fotos chegarem,
troque os arquivos mantendo os nomes (ou aponte `fotos` pros novos caminhos).
O enquadramento da grade é 4:5 (retrato) sobre fundo neutro — bege, madeira
clara ou linho, como nas provisórias.

## Como funciona o checkout

O pedido é fechado no site e **confirmado no WhatsApp**:

1. A pessoa preenche entrega e escolhe Pix, cartão ou "combinar no WhatsApp".
   O CEP puxa o endereço pelo [ViaCEP](https://viacep.com.br); se a consulta
   falhar, é só preencher à mão.
2. Ao finalizar, o site abre o WhatsApp da loja com o pedido já escrito —
   itens, variações, totais, forma de pagamento e endereço — e um número
   (`ASH-XXXXXX`) pra referência.
3. Na tela de confirmação aparece a chave Pix (com botão de copiar) ou o link
   de pagamento com cartão.

Isso roda sem servidor e sem chave de API — de propósito: um site estático não
tem onde guardar segredo de gateway sem expô-lo.

### Cobrando de verdade no cartão e no Pix

Duas opções, em ordem de esforço:

- **Link de pagamento** (imediato): gere um link no painel do seu gateway
  (Asaas, Mercado Pago, InfinitePay) e coloque em `cartaoLink`. A opção
  "cartão" passa a aparecer no checkout e leva pro ambiente seguro dele. O
  valor exato do pedido vai junto na mensagem do WhatsApp.
- **Cobrança automática** (Pix com QR code e cartão parcelado, sem conversa):
  exige um backend pra guardar a chave de API e criar a cobrança. Este repositório
  já tem uma integração com a Asaas em `src/lib/asaas.ts` (usada pelo Onmode)
  que serve de ponto de partida.

## Publicando

Na Vercel, é um projeto separado do app na raiz do repositório:
**Add New → Project → este repositório → Root Directory: `ashford`**. O
[`vercel.json`](./vercel.json) daqui já marca o projeto como estático
(`framework: null`), então não há build — a pasta sobe como está.

Funciona igual em Netlify, Cloudflare Pages ou GitHub Pages.

## Notas de manutenção

- **Cabeçalho e rodapé são repetidos em cada página.** É a contrapartida de
  não ter build: ao mudar um link do menu, mude nos seis arquivos.
- **O carrinho vive no `localStorage`** do navegador de quem compra
  (`ashford:carrinho:v1`), junto com os dados de entrega da última compra.
  Nada sai do dispositivo até a pessoa finalizar o pedido.
- **Acessibilidade**: navegação por teclado, foco visível, `aria-label` nos
  ícones e respeito a `prefers-reduced-motion`.

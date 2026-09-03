# Fluxo Criativo — site de portfólio

Site de uma página, em HTML/CSS/JS puro (sem build, sem framework), para a
marca **Fluxo Criativo** — estúdio freelancer de código, design e conteúdo
para negócios locais de Belém-PA.

Tipografia: [Bitter](https://fonts.google.com/specimen/Bitter) (títulos) +
[Work Sans](https://fonts.google.com/specimen/Work+Sans) (corpo), carregadas
via Google Fonts — a única dependência externa do site.

```
fluxo-criativo/
├── index.html
├── css/
│   └── style.css
└── js/
    └── script.js
```

## WhatsApp

O número já está configurado em `js/script.js`:

```js
var WHATSAPP_NUMBER = "5591992477891";
```

Todos os botões "Chamar no WhatsApp" da página usam essa mesma constante —
pra trocar o número no futuro, só precisa mudar em um lugar.

## Rodando localmente

Como não há build nem dependências, qualquer servidor estático serve.
Duas opções simples:

```bash
# Python (já vem em quase todo sistema)
cd fluxo-criativo
python3 -m http.server 8080
# abra http://localhost:8080
```

```bash
# Node, sem instalar nada globalmente
cd fluxo-criativo
npx serve .
```

Abrir o `index.html` direto no navegador (duplo clique) também funciona,
mas um servidor local evita eventuais bloqueios de `file://` no navegador.

## Deploy

O site é 100% estático, então qualquer host de arquivos estáticos serve.

**Vercel**
- Novo projeto → importe o repositório.
- Root Directory: `fluxo-criativo`
- Framework Preset: **Other** (sem build).
- Build Command / Output Directory: deixe em branco (ou Output Directory `.`).

**Netlify**
- Novo site → importe o repositório.
- Base directory: `fluxo-criativo`
- Build command: (vazio)
- Publish directory: `fluxo-criativo` (ou `.` se a base directory já estiver setada)

Também dá pra arrastar a pasta `fluxo-criativo` direto no painel do Netlify
("Deploys" → arraste a pasta) sem passar pelo Git.

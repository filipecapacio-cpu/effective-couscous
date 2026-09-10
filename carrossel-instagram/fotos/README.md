# Fotos — carrosséis de exemplo

Pasta de destino para as fotos reais que vão substituir os placeholders "FOTO" nos exemplos de `../exemplos/`.

Salve os arquivos aqui usando os nomes abaixo — cada um corresponde a uma posição específica de painel de foto (460px, lado direito) nos carrosséis:

| Arquivo | Carrossel | Slide | Legenda atual do placeholder |
|---|---|---|---|
| `ciclos_cursinho.jpg` | `carrossel_ciclos.html` | 3 | ROTINA — CURSINHO |
| `ciclos_home_office.jpg` | `carrossel_ciclos.html` | 5 | ROTINA — HOME OFFICE |
| `ciclos_treino_atual.jpg` | `carrossel_ciclos.html` | 7 | CARATÊ — TREINO ATUAL |
| `estudo_treino_manha.jpg` | `carrossel_estudo_trabalho.html` | 3 | TREINO — MANHÃ |
| `estudo_mesa_bloco1.jpg` | `carrossel_estudo_trabalho.html` | 4 | MESA — BLOCO 1 |
| `estudo_estudo_noite.jpg` | `carrossel_estudo_trabalho.html` | 6 | ESTUDO — NOITE |
| `estudo_karate_noite.jpg` | `carrossel_estudo_trabalho.html` | 8 | CARATÊ — NOITE |

Formato recomendado: retrato (proporção próxima de 460×1350, ou mais alta — o painel corta e centraliza), JPG ou PNG, o maior tamanho disponível (o site aplica o filtro tonal `grayscale(15%) contrast(1.08) brightness(1.02)` por cima via CSS, então a imagem original pode ser colorida).

Assim que os arquivos estiverem aqui, os dois HTMLs em `../exemplos/` são atualizados para usar `<img>` real dentro de `.photo-panel` no lugar do placeholder, mantendo o painel lateral de 460px e o gradiente de transição pro fundo escuro.

/* ==========================================================================
   Ashford — comportamento de cada página
   Qual bloco roda é decidido por data-pagina no <body>: home, categoria,
   produto ou carrinho. Tudo lê do catálogo, então a loja inteira acompanha
   qualquer mudança em js/catalogo.js.
   ========================================================================== */

(function () {
  "use strict";

  var A = window.Ashford;

  function parametro(nome) {
    return new URLSearchParams(window.location.search).get(nome) || "";
  }

  // =======================================================================
  // Home
  // =======================================================================
  function home() {
    var categorias = document.getElementById("listaCategorias");
    if (categorias) {
      categorias.innerHTML = A.categorias()
        .map(function (c) {
          return (
            '<a class="categoria-card" href="categoria.html?c=' + encodeURIComponent(c.slug) + '" data-reveal>' +
            '<img src="' + c.capa + '" alt="' + A.escapar(c.nome) + ' Ashford" loading="lazy" width="1400" height="900">' +
            '<span class="categoria-corpo">' +
            "<h3>" + A.escapar(c.nome) + "</h3>" +
            "<p>" + A.escapar(c.chamada) + "</p>" +
            '<span class="link-fio">Ver ' + A.escapar(c.nome.toLowerCase()) + "</span>" +
            "</span></a>"
          );
        })
        .join("");
    }

    var destaques = document.getElementById("listaDestaques");
    if (destaques) {
      destaques.innerHTML = A.produtos()
        .filter(function (p) {
          return p.destaque;
        })
        .slice(0, 4)
        .map(A.cartaoProduto)
        .join("");
    }

    // Vitrine do Instagram: enquanto não há feed conectado, as próprias fotos
    // do catálogo ocupam a grade e levam pro perfil.
    var insta = document.getElementById("gradeInstagram");
    if (insta) {
      insta.innerHTML = A.produtos()
        .slice(0, 6)
        .map(function (p) {
          return (
            '<a data-instagram href="#" aria-label="Ver @' + A.escapar(A.cfg.instagram) + ' no Instagram">' +
            '<img src="' + p.fotos[2] + '" alt="" loading="lazy" width="1000" height="1250"></a>'
          );
        })
        .join("");
    }
  }

  // =======================================================================
  // Categoria
  // =======================================================================
  function categoria() {
    var slug = parametro("c");
    var cat = A.categoria(slug) || A.categorias()[0];
    var itens = A.porCategoria(cat.slug);

    document.title = cat.nome + " — Ashford";
    var titulo = document.getElementById("tituloCategoria");
    var chamada = document.getElementById("chamadaCategoria");
    var migalha = document.getElementById("migalhaCategoria");
    if (titulo) titulo.textContent = cat.nome;
    if (chamada) chamada.textContent = cat.chamada;
    if (migalha) migalha.textContent = cat.nome;

    // Abas das outras categorias, pra trocar sem voltar pra home.
    var abas = document.getElementById("abasCategorias");
    if (abas) {
      abas.innerHTML = A.categorias()
        .map(function (c) {
          var atual = c.slug === cat.slug ? ' aria-current="page"' : "";
          return '<a href="categoria.html?c=' + encodeURIComponent(c.slug) + '"' + atual + ">" + A.escapar(c.nome) + "</a>";
        })
        .join("");
    }

    var grade = document.getElementById("gradeCategoria");
    var contagem = document.getElementById("contagemCategoria");
    var ordem = document.getElementById("ordenacao");

    function desenhar() {
      var lista = itens.slice();
      var criterio = ordem ? ordem.value : "curadoria";
      if (criterio === "menor") lista.sort(function (a, b) { return a.preco - b.preco; });
      if (criterio === "maior") lista.sort(function (a, b) { return b.preco - a.preco; });
      if (criterio === "nome") lista.sort(function (a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); });

      grade.innerHTML = lista.map(A.cartaoProduto).join("");
      if (contagem) {
        contagem.textContent = lista.length + (lista.length === 1 ? " peça" : " peças");
      }
    }

    if (grade) desenhar();
    if (ordem) ordem.addEventListener("change", desenhar);
  }

  // =======================================================================
  // Produto
  // =======================================================================
  function produto() {
    var p = A.produto(parametro("id"));
    var raiz = document.getElementById("produto");
    if (!raiz) return;

    if (!p) {
      raiz.innerHTML =
        '<div class="vazio"><h2>Peça não encontrada</h2><p>Talvez ela tenha saído do catálogo.</p>' +
        '<p style="margin-top:22px"><a class="btn" href="index.html">Voltar à loja</a></p></div>';
      return;
    }

    document.title = p.nome + " — Ashford";
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", p.resumo);

    var cat = A.categoria(p.categoria);

    raiz.innerHTML =
      '<nav class="migalhas" aria-label="Você está em">' +
      '<a href="index.html">Início</a> / <a href="categoria.html?c=' + cat.slug + '">' + A.escapar(cat.nome) + "</a> / " +
      A.escapar(p.nome) +
      "</nav>" +
      '<div class="produto-layout">' +
      '<div class="produto-galeria">' +
      '<div class="carrossel">' +
      '<div class="carrossel-trilho" id="trilho">' +
      p.fotos
        .map(function (f, i) {
          return '<img src="' + f + '" alt="' + A.escapar(p.nome) + " — foto " + (i + 1) +
            '" width="1000" height="1250"' + (i ? ' loading="lazy"' : "") + ">";
        })
        .join("") +
      "</div>" +
      '<button class="carrossel-seta anterior" type="button" id="setaAnterior" aria-label="Foto anterior">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<button class="carrossel-seta proxima" type="button" id="setaProxima" aria-label="Próxima foto">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>' +
      "</div>" +
      '<div class="miniaturas" id="miniaturas">' +
      p.fotos
        .map(function (f, i) {
          return '<button type="button" data-foto="' + i + '" aria-current="' + (i === 0) +
            '" aria-label="Ver foto ' + (i + 1) + '"><img src="' + f + '" alt="" loading="lazy"></button>';
        })
        .join("") +
      "</div>" +
      "</div>" +

      '<div class="produto-info">' +
      '<p class="eyebrow">' + A.escapar(cat.nome) + "</p>" +
      "<h1>" + A.escapar(p.nome) + "</h1>" +
      '<p class="preco-grande">' + A.moeda(p.preco) + "</p>" +
      '<p class="preco-nota">' + A.parcelado(p.preco) + " · " +
      A.moeda(p.preco * (1 - (A.cfg.pixDesconto || 0))) + " no Pix</p>" +
      '<p class="produto-texto">' + A.escapar(p.descricao) + "</p>" +

      '<form id="formCompra">' +
      p.variacoes
        .map(function (v, vi) {
          return (
            '<div class="variacao">' +
            '<p class="variacao-titulo">' + A.escapar(v.titulo) + "</p>" +
            '<div class="opcoes">' +
            v.opcoes
              .map(function (o, oi) {
                var id = "v" + vi + "o" + oi;
                return (
                  '<input type="radio" name="' + A.escapar(v.titulo) + '" id="' + id + '" value="' +
                  A.escapar(o) + '"' + (oi === 0 ? " checked" : "") + ">" +
                  '<label for="' + id + '">' + A.escapar(o) + "</label>"
                );
              })
              .join("") +
            "</div></div>"
          );
        })
        .join("") +

      '<div class="compra">' +
      '<div class="quantidade">' +
      '<button type="button" id="menos" aria-label="Diminuir quantidade">−</button>' +
      '<span id="qtd" aria-live="polite">1</span>' +
      '<button type="button" id="mais" aria-label="Aumentar quantidade">+</button>' +
      "</div>" +
      '<button class="btn" type="submit">Adicionar à sacola</button>' +
      "</div>" +
      "</form>" +

      '<div class="acordeao">' +
      "<details open><summary>Detalhes da peça</summary><ul>" +
      p.detalhes
        .map(function (d) {
          return "<li>" + A.escapar(d) + "</li>";
        })
        .join("") +
      "</ul></details>" +
      "<details><summary>Entrega</summary><p>Enviamos para todo o Brasil. Capitais em " +
      A.escapar(A.cfg.prazoCapital) + "; demais cidades em " + A.escapar(A.cfg.prazoDemais) +
      ". Frete grátis acima de " + A.moeda(A.cfg.freteGratisAcima) + ".</p></details>" +
      "<details><summary>Trocas e devoluções</summary><p>30 dias para trocar ou devolver, sem custo, desde que a peça não tenha sido usada. É só chamar no WhatsApp que organizamos a coleta.</p></details>" +
      "</div>" +

      '<p class="preco-nota" style="margin-top:24px">Dúvida sobre tamanho ou acabamento? ' +
      '<a class="link-fio" data-whatsapp data-whatsapp-msg="Olá! Tenho uma dúvida sobre a ' +
      A.escapar(p.nome) + '." href="#">Chamar no WhatsApp</a></p>' +
      "</div></div>";

    wireCarrossel(p);
    wireCompra(p);
    relacionados(p);
    A.iniciar();
  }

  function wireCarrossel(p) {
    var trilho = document.getElementById("trilho");
    var minis = document.getElementById("miniaturas");
    var atual = 0;

    function ir(indice) {
      atual = Math.max(0, Math.min(p.fotos.length - 1, indice));
      trilho.scrollTo({ left: trilho.clientWidth * atual, behavior: "smooth" });
      marcar();
    }

    function marcar() {
      minis.querySelectorAll("button").forEach(function (b, i) {
        b.setAttribute("aria-current", String(i === atual));
      });
    }

    document.getElementById("setaAnterior").addEventListener("click", function () {
      ir(atual - 1);
    });
    document.getElementById("setaProxima").addEventListener("click", function () {
      ir(atual + 1);
    });
    minis.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-foto]");
      if (b) ir(Number(b.getAttribute("data-foto")));
    });

    // Arrastar com o dedo também move as miniaturas.
    trilho.addEventListener("scroll", function () {
      var i = Math.round(trilho.scrollLeft / trilho.clientWidth);
      if (i !== atual) {
        atual = i;
        marcar();
      }
    });
  }

  function wireCompra(p) {
    var form = document.getElementById("formCompra");
    var qtdEl = document.getElementById("qtd");
    var qtd = 1;

    document.getElementById("menos").addEventListener("click", function () {
      qtd = Math.max(1, qtd - 1);
      qtdEl.textContent = String(qtd);
    });
    document.getElementById("mais").addEventListener("click", function () {
      qtd = Math.min(20, qtd + 1);
      qtdEl.textContent = String(qtd);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var escolhas = {};
      p.variacoes.forEach(function (v) {
        var marcado = form.querySelector('input[name="' + v.titulo + '"]:checked');
        if (marcado) escolhas[v.titulo] = marcado.value;
      });
      A.adicionar(p.slug, escolhas, qtd);
      A.aviso(p.nome + " na sacola.");
    });
  }

  function relacionados(p) {
    var alvo = document.getElementById("gradeRelacionados");
    if (!alvo) return;

    // Primeiro as irmãs da mesma categoria; se faltar, completa com o resto.
    var mesma = A.porCategoria(p.categoria).filter(function (o) {
      return o.slug !== p.slug;
    });
    var outras = A.produtos().filter(function (o) {
      return o.categoria !== p.categoria;
    });
    alvo.innerHTML = mesma.concat(outras).slice(0, 4).map(A.cartaoProduto).join("");
  }

  // =======================================================================
  // Carrinho e checkout
  // =======================================================================
  function carrinho() {
    var lista = document.getElementById("listaCarrinho");
    var resumo = document.getElementById("resumoCarrinho");
    var vazio = document.getElementById("carrinhoVazio");
    var conteudo = document.getElementById("carrinhoConteudo");
    var form = document.getElementById("formPedido");
    if (!lista) return;

    function formaEscolhida() {
      var m = document.querySelector('input[name="pagamento"]:checked');
      return m ? m.value : "pix";
    }

    function desenhar() {
      var itens = A.lerCarrinho();
      var temItens = itens.length > 0;
      conteudo.hidden = !temItens;
      vazio.hidden = temItens;
      if (!temItens) return;

      lista.innerHTML = itens
        .map(function (i) {
          var p = A.produto(i.slug);
          var id = A.identidade(i.slug, i.variacoes);
          var variacao = Object.keys(i.variacoes)
            .map(function (k) {
              return k + ": " + i.variacoes[k];
            })
            .join(" · ");

          return (
            '<div class="linha-item">' +
            '<a href="produto.html?id=' + p.slug + '"><img src="' + p.fotos[0] + '" alt="' + A.escapar(p.nome) + '"></a>' +
            "<div>" +
            '<a class="linha-nome" href="produto.html?id=' + p.slug + '">' + A.escapar(p.nome) + "</a>" +
            '<p class="linha-variacao">' + A.escapar(variacao || "—") + "</p>" +
            '<div class="linha-controles">' +
            '<span class="quantidade quantidade-sm">' +
            '<button type="button" data-menos="' + A.escapar(id) + '" aria-label="Diminuir quantidade de ' + A.escapar(p.nome) + '">−</button>' +
            "<span>" + i.qtd + "</span>" +
            '<button type="button" data-mais="' + A.escapar(id) + '" aria-label="Aumentar quantidade de ' + A.escapar(p.nome) + '">+</button>' +
            "</span>" +
            "<strong>" + A.moeda(p.preco * i.qtd) + "</strong>" +
            '<button type="button" class="linha-remover" data-remover="' + A.escapar(id) + '">Remover</button>' +
            "</div></div></div>"
          );
        })
        .join("");

      desenharResumo();
    }

    function desenharResumo() {
      var t = A.totais(formaEscolhida());
      resumo.innerHTML =
        '<div class="resumo-linha"><span>Subtotal</span><span>' + A.moeda(t.subtotal) + "</span></div>" +
        (t.desconto
          ? '<div class="resumo-linha"><span>Desconto Pix (' + Math.round(A.cfg.pixDesconto * 100) +
            "%)</span><span>− " + A.moeda(t.desconto) + "</span></div>"
          : "") +
        '<div class="resumo-linha"><span>Frete</span><span>' +
        (t.frete ? A.moeda(t.frete) : "Grátis") + "</span></div>" +
        '<div class="resumo-total"><span>Total</span><span>' + A.moeda(t.total) + "</span></div>" +
        (formaEscolhida() === "cartao" && A.parcelado(t.total)
          ? '<p class="resumo-nota">' + A.parcelado(t.total) + "</p>"
          : "") +
        (t.frete
          ? '<p class="resumo-nota">Faltam ' + A.moeda(A.cfg.freteGratisAcima - t.subtotal) + " para o frete sair de graça.</p>"
          : "");
    }

    lista.addEventListener("click", function (e) {
      var alvo = e.target.closest("button");
      if (!alvo) return;
      if (alvo.dataset.menos) A.mudarQuantidade(alvo.dataset.menos, -1);
      else if (alvo.dataset.mais) A.mudarQuantidade(alvo.dataset.mais, 1);
      else if (alvo.dataset.remover) A.remover(alvo.dataset.remover);
    });

    document.addEventListener("ashford:carrinho", desenhar);

    document.querySelectorAll('input[name="pagamento"]').forEach(function (r) {
      r.addEventListener("change", function () {
        desenharResumo();
        var caixa = document.getElementById("caixaPix");
        if (caixa) caixa.hidden = formaEscolhida() !== "pix";
      });
    });

    preencherPix();
    preencherSalvos(form);
    wireCep(form);
    wireEnvio(form, formaEscolhida);
    desenhar();
  }

  function preencherPix() {
    var chave = document.getElementById("pixChave");
    var titular = document.getElementById("pixTitular");
    var botao = document.getElementById("copiarPix");
    if (chave) chave.textContent = A.cfg.pixChave || "";
    if (titular) titular.textContent = A.cfg.pixTitular || "";

    if (botao) {
      botao.addEventListener("click", function () {
        var texto = A.cfg.pixChave || "";
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(texto).then(function () {
            A.aviso("Chave Pix copiada.");
          });
        } else {
          // Navegador sem clipboard: seleciona pra pessoa copiar na mão.
          var faixa = document.createRange();
          faixa.selectNodeContents(document.getElementById("pixChave"));
          window.getSelection().removeAllRanges();
          window.getSelection().addRange(faixa);
          A.aviso("Selecionamos a chave — é só copiar.");
        }
      });
    }
  }

  function preencherSalvos(form) {
    if (!form) return;
    var dados = A.lerDados();
    Object.keys(dados).forEach(function (campo) {
      var el = form.elements[campo];
      if (el && typeof el.value === "string") el.value = dados[campo];
    });
  }

  /** Busca o endereço pelo CEP (ViaCEP). Se a consulta falhar, a pessoa
      simplesmente preenche à mão — nada trava. */
  function wireCep(form) {
    if (!form) return;
    var cep = form.elements.cep;
    if (!cep) return;

    cep.addEventListener("blur", function () {
      var digitos = cep.value.replace(/\D/g, "");
      if (digitos.length !== 8) return;

      fetch("https://viacep.com.br/ws/" + digitos + "/json/")
        .then(function (r) {
          return r.json();
        })
        .then(function (d) {
          if (d.erro) return;
          if (!form.elements.endereco.value) form.elements.endereco.value = d.logradouro || "";
          if (!form.elements.bairro.value) form.elements.bairro.value = d.bairro || "";
          if (!form.elements.cidade.value) form.elements.cidade.value = d.localidade || "";
          if (!form.elements.uf.value) form.elements.uf.value = d.uf || "";
          form.elements.numero.focus();
        })
        .catch(function () {
          /* sem internet ou ViaCEP fora do ar: segue no preenchimento manual */
        });
    });
  }

  /** Monta o pedido em texto e abre o WhatsApp da loja com ele pronto. */
  function mensagemPedido(dados, forma, numero) {
    var t = A.totais(forma);
    var linhas = A.lerCarrinho().map(function (i) {
      var p = A.produto(i.slug);
      var variacao = Object.keys(i.variacoes)
        .map(function (k) {
          return i.variacoes[k];
        })
        .join(", ");
      return "• " + i.qtd + "x " + p.nome + (variacao ? " (" + variacao + ")" : "") + " — " + A.moeda(p.preco * i.qtd);
    });

    var nomeForma = { pix: "Pix", cartao: "Cartão de crédito", combinar: "A combinar" }[forma] || forma;

    return [
      "*Pedido " + numero + " — Ashford*",
      "",
      linhas.join("\n"),
      "",
      "Subtotal: " + A.moeda(t.subtotal),
      t.desconto ? "Desconto Pix: − " + A.moeda(t.desconto) : null,
      "Frete: " + (t.frete ? A.moeda(t.frete) : "grátis"),
      "*Total: " + A.moeda(t.total) + "*",
      "Pagamento: " + nomeForma,
      "",
      "*Entrega*",
      dados.nome,
      dados.documento ? "CPF: " + dados.documento : null,
      dados.endereco + ", " + dados.numero + (dados.complemento ? " — " + dados.complemento : ""),
      dados.bairro + " — " + dados.cidade + "/" + dados.uf,
      "CEP " + dados.cep,
      dados.observacoes ? "\nObservações: " + dados.observacoes : null,
    ]
      .filter(function (l) {
        return l !== null && l !== undefined;
      })
      .join("\n");
  }

  function wireEnvio(form, formaEscolhida) {
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!A.lerCarrinho().length) return;

      var dados = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (el.name) dados[el.name] = el.value.trim();
      });
      A.gravarDados(dados);

      var forma = formaEscolhida();
      var numero = "ASH-" + Date.now().toString(36).toUpperCase().slice(-6);
      var mensagem = mensagemPedido(dados, forma, numero);

      // Abre a conversa já com o pedido escrito. O pagamento é confirmado ali
      // (Pix) ou pelo link do gateway (cartão).
      window.open(A.linkWhatsapp(mensagem), "_blank", "noopener");

      var total = A.moeda(A.totais(forma).total);
      var confirmacao = document.getElementById("confirmacao");
      document.getElementById("carrinhoConteudo").hidden = true;
      confirmacao.hidden = false;
      document.getElementById("numeroPedido").textContent = numero;
      document.getElementById("totalPedido").textContent = total;
      document.getElementById("formaPedido").textContent =
        { pix: "Pix", cartao: "cartão de crédito", combinar: "a combinar no WhatsApp" }[forma];

      var blocoPix = document.getElementById("confirmacaoPix");
      if (blocoPix) blocoPix.hidden = forma !== "pix";
      // Com link de pagamento configurado, mostramos o botão; sem ele, o link
      // seguro vai pelo WhatsApp, na mesma conversa.
      var blocoCartao = document.getElementById("confirmacaoCartao");
      if (blocoCartao) {
        blocoCartao.hidden = forma !== "cartao";
        var link = document.getElementById("linkCartao");
        var semLink = document.getElementById("cartaoSemLink");
        if (link) {
          link.hidden = !A.cfg.cartaoLink;
          if (A.cfg.cartaoLink) link.href = A.cfg.cartaoLink;
        }
        if (semLink) semLink.hidden = !!A.cfg.cartaoLink;
      }

      document.getElementById("abrirWhatsapp").href = A.linkWhatsapp(mensagem);
      confirmacao.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    var limpar = document.getElementById("limparCarrinho");
    if (limpar) {
      limpar.addEventListener("click", function () {
        A.limpar();
        document.getElementById("confirmacao").hidden = true;
        A.aviso("Sacola esvaziada.");
      });
    }
  }

  // =======================================================================
  var paginas = { home: home, categoria: categoria, produto: produto, carrinho: carrinho };

  document.addEventListener("DOMContentLoaded", function () {
    var pagina = document.body.getAttribute("data-pagina");
    if (paginas[pagina]) paginas[pagina]();
  });
})();

/* ==========================================================================
   Ashford — núcleo da loja
   Carrinho (localStorage), formatação, links de contato e o que todo página
   compartilha: menu, selo do carrinho, ano do rodapé, entrada ao rolar.
   Em pt-BR, sem framework e sem build — abre direto no navegador.
   ========================================================================== */

var Ashford = (function () {
  "use strict";

  var CHAVE_CARRINHO = "ashford:carrinho:v1";
  var CHAVE_DADOS = "ashford:dados-entrega:v1";
  var cfg = window.ASHFORD_CONFIG || {};

  // -----------------------------------------------------------------------
  // Formatação
  // -----------------------------------------------------------------------
  function moeda(valor) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    });
  }

  /** Texto do parcelamento sem juros, do jeito que a loja anuncia. */
  function parcelado(valor) {
    var n = cfg.cartaoParcelas || 1;
    if (n < 2) return "";
    return "ou " + n + "x de " + moeda(valor / n) + " sem juros";
  }

  // -----------------------------------------------------------------------
  // Catálogo
  // -----------------------------------------------------------------------
  function produtos() {
    return window.ASHFORD_PRODUTOS || [];
  }

  function categorias() {
    return window.ASHFORD_CATEGORIAS || [];
  }

  function produto(slug) {
    return produtos().filter(function (p) {
      return p.slug === slug;
    })[0];
  }

  function categoria(slug) {
    return categorias().filter(function (c) {
      return c.slug === slug;
    })[0];
  }

  function porCategoria(slug) {
    return produtos().filter(function (p) {
      return p.categoria === slug;
    });
  }

  // -----------------------------------------------------------------------
  // Carrinho
  // -----------------------------------------------------------------------
  // Um item é { slug, variacoes: {Cor: "Marinho", ...}, qtd }. Duas linhas do
  // mesmo produto em variações diferentes são itens separados — por isso a
  // identidade inclui as variações escolhidas.
  function identidade(slug, variacoes) {
    var partes = Object.keys(variacoes || {})
      .sort()
      .map(function (k) {
        return k + "=" + variacoes[k];
      });
    return [slug].concat(partes).join("|");
  }

  function lerCarrinho() {
    try {
      var bruto = localStorage.getItem(CHAVE_CARRINHO);
      var itens = bruto ? JSON.parse(bruto) : [];
      if (!Array.isArray(itens)) return [];
      // Descarta item de produto que saiu do catálogo.
      return itens.filter(function (i) {
        return i && produto(i.slug);
      });
    } catch (e) {
      return [];
    }
  }

  function gravarCarrinho(itens) {
    try {
      localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens));
    } catch (e) {
      /* navegador sem storage (aba anônima com cookies bloqueados): segue sem persistir */
    }
    atualizarSelo();
    document.dispatchEvent(new CustomEvent("ashford:carrinho"));
  }

  function adicionar(slug, variacoes, qtd) {
    var itens = lerCarrinho();
    var id = identidade(slug, variacoes);
    var existente = itens.filter(function (i) {
      return identidade(i.slug, i.variacoes) === id;
    })[0];

    if (existente) existente.qtd += qtd || 1;
    else itens.push({ slug: slug, variacoes: variacoes || {}, qtd: qtd || 1 });

    gravarCarrinho(itens);
  }

  function mudarQuantidade(id, delta) {
    var itens = lerCarrinho().map(function (i) {
      if (identidade(i.slug, i.variacoes) === id) i.qtd = Math.max(1, i.qtd + delta);
      return i;
    });
    gravarCarrinho(itens);
  }

  function remover(id) {
    gravarCarrinho(
      lerCarrinho().filter(function (i) {
        return identidade(i.slug, i.variacoes) !== id;
      })
    );
  }

  function limpar() {
    gravarCarrinho([]);
  }

  function totalItens() {
    return lerCarrinho().reduce(function (soma, i) {
      return soma + i.qtd;
    }, 0);
  }

  /** Subtotal, frete e total — a mesma conta usada no resumo e no pedido. */
  function totais(formaPagamento) {
    var subtotal = lerCarrinho().reduce(function (soma, i) {
      var p = produto(i.slug);
      return soma + (p ? p.preco * i.qtd : 0);
    }, 0);

    var frete = 0;
    if (subtotal > 0 && subtotal < (cfg.freteGratisAcima || 0)) frete = cfg.frete || 0;

    var desconto = 0;
    if (formaPagamento === "pix" && cfg.pixDesconto) desconto = subtotal * cfg.pixDesconto;

    return {
      subtotal: subtotal,
      frete: frete,
      desconto: desconto,
      total: Math.max(0, subtotal - desconto + frete),
    };
  }

  // Dados de entrega ficam salvos pra segunda compra não recomeçar do zero.
  function lerDados() {
    try {
      return JSON.parse(localStorage.getItem(CHAVE_DADOS) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function gravarDados(dados) {
    try {
      localStorage.setItem(CHAVE_DADOS, JSON.stringify(dados));
    } catch (e) {
      /* idem: sem storage, só não lembra na próxima visita */
    }
  }

  // -----------------------------------------------------------------------
  // Contato
  // -----------------------------------------------------------------------
  function linkWhatsapp(mensagem) {
    var digitos = String(cfg.whatsapp || "").replace(/\D/g, "");
    return (
      "https://wa.me/" + digitos + "?text=" + encodeURIComponent(mensagem || cfg.whatsappMensagem || "")
    );
  }

  function linkInstagram() {
    return "https://instagram.com/" + (cfg.instagram || "");
  }

  // -----------------------------------------------------------------------
  // Peças de interface reaproveitadas
  // -----------------------------------------------------------------------
  function escapar(texto) {
    return String(texto).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function cartaoProduto(p) {
    var segunda = p.fotos[1] || p.fotos[0];
    return (
      '<a class="produto-card" href="produto.html?id=' + encodeURIComponent(p.slug) + '">' +
      '<span class="produto-foto">' +
      '<img src="' + p.fotos[0] + '" alt="' + escapar(p.nome) + '" loading="lazy" width="1000" height="1250">' +
      '<img src="' + segunda + '" alt="" aria-hidden="true" loading="lazy" width="1000" height="1250">' +
      (p.destaque ? '<span class="produto-tag">Destaque</span>' : "") +
      "</span>" +
      '<span class="produto-nome">' + escapar(p.nome) + "</span>" +
      '<span class="produto-resumo">' + escapar(p.resumo) + "</span>" +
      '<span class="produto-preco">' + moeda(p.preco) +
      (parcelado(p.preco) ? "<small>" + parcelado(p.preco) + "</small>" : "") +
      "</span>" +
      "</a>"
    );
  }

  function aviso(texto) {
    var el = document.getElementById("aviso");
    if (!el) return;
    el.textContent = texto;
    el.classList.add("visivel");
    clearTimeout(el._timer);
    el._timer = setTimeout(function () {
      el.classList.remove("visivel");
    }, 2600);
  }

  function atualizarSelo() {
    var total = totalItens();
    document.querySelectorAll("[data-selo-carrinho]").forEach(function (el) {
      el.textContent = String(total);
      el.hidden = total === 0;
    });
  }

  // -----------------------------------------------------------------------
  // Amarração comum a todas as páginas
  // -----------------------------------------------------------------------
  function wireContato() {
    document.querySelectorAll("[data-whatsapp]").forEach(function (el) {
      el.setAttribute("href", linkWhatsapp(el.getAttribute("data-whatsapp-msg") || ""));
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    });

    document.querySelectorAll("[data-instagram]").forEach(function (el) {
      el.setAttribute("href", linkInstagram());
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    });

    document.querySelectorAll("[data-instagram-arroba]").forEach(function (el) {
      el.textContent = "@" + (cfg.instagram || "");
    });

    document.querySelectorAll("[data-email]").forEach(function (el) {
      el.setAttribute("href", "mailto:" + (cfg.email || ""));
      if (el.hasAttribute("data-email-texto")) el.textContent = cfg.email || "";
    });

    document.querySelectorAll("[data-frete-gratis]").forEach(function (el) {
      el.textContent = moeda(cfg.freteGratisAcima || 0);
    });
  }

  function wireMenu() {
    var botao = document.getElementById("menuBotao");
    var menu = document.getElementById("menuMobile");
    if (!botao || !menu || botao.dataset.amarrado) return;
    botao.dataset.amarrado = "1";

    botao.addEventListener("click", function () {
      var aberto = menu.classList.toggle("aberto");
      botao.setAttribute("aria-expanded", String(aberto));
    });
  }

  function wireReveal() {
    // Só blocos ainda não observados — iniciar() pode rodar mais de uma vez.
    var alvos = document.querySelectorAll("[data-reveal]:not(.reveal)");
    alvos.forEach(function (el) {
      el.classList.add("reveal");
    });

    if (!("IntersectionObserver" in window)) {
      alvos.forEach(function (el) {
        el.classList.add("visivel");
      });
      return;
    }

    var obs = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("visivel");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    alvos.forEach(function (el) {
      obs.observe(el);
    });
  }

  function wireAno() {
    document.querySelectorAll("[data-ano]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  function iniciar() {
    wireContato();
    wireMenu();
    wireAno();
    wireReveal();
    atualizarSelo();
  }

  return {
    cfg: cfg,
    moeda: moeda,
    parcelado: parcelado,
    escapar: escapar,
    produtos: produtos,
    categorias: categorias,
    produto: produto,
    categoria: categoria,
    porCategoria: porCategoria,
    identidade: identidade,
    lerCarrinho: lerCarrinho,
    adicionar: adicionar,
    mudarQuantidade: mudarQuantidade,
    remover: remover,
    limpar: limpar,
    totalItens: totalItens,
    totais: totais,
    lerDados: lerDados,
    gravarDados: gravarDados,
    linkWhatsapp: linkWhatsapp,
    linkInstagram: linkInstagram,
    cartaoProduto: cartaoProduto,
    aviso: aviso,
    iniciar: iniciar,
  };
})();

document.addEventListener("DOMContentLoaded", function () {
  Ashford.iniciar();
});

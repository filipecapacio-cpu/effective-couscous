(function () {
  "use strict";

  // ---------------------------------------------------------------------
  // Formato: código do país + DDD + número, só dígitos (ex: 5591988887777)
  // ---------------------------------------------------------------------
  var WHATSAPP_NUMBER = "5591992477891";
  var WHATSAPP_MESSAGE = "Oi! Vi o site da Fluxo Criativo e quero saber mais.";

  function buildWhatsappLink() {
    var digits = WHATSAPP_NUMBER.replace(/\D/g, "");
    var base = digits ? "https://wa.me/" + digits : "https://wa.me/";
    return base + "?text=" + encodeURIComponent(WHATSAPP_MESSAGE);
  }

  function wireWhatsappLinks() {
    var link = buildWhatsappLink();
    var els = document.querySelectorAll("[data-whatsapp]");
    for (var i = 0; i < els.length; i++) {
      els[i].setAttribute("href", link);
      els[i].setAttribute("target", "_blank");
      els[i].setAttribute("rel", "noopener noreferrer");
    }
  }

  // ---------------------------------------------------------------------
  // Menu mobile
  // ---------------------------------------------------------------------
  function wireMenu() {
    var toggle = document.getElementById("menuToggle");
    var nav = document.getElementById("siteNav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ---------------------------------------------------------------------
  // Ano no rodapé
  // ---------------------------------------------------------------------
  function wireYear() {
    var el = document.getElementById("ano");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  // ---------------------------------------------------------------------
  // Entrada suave dos blocos ao rolar a página
  // ---------------------------------------------------------------------
  function wireReveal() {
    var targets = document.querySelectorAll(
      ".row-frente, .case, .depoimento-box"
    );

    targets.forEach(function (el) {
      el.classList.add("reveal");
    });

    if (!("IntersectionObserver" in window)) {
      targets.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    wireWhatsappLinks();
    wireMenu();
    wireYear();
    wireReveal();
  });
})();

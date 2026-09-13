/* ==========================================================================
   Ashford — configuração da loja
   Tudo que muda com o tempo (contato, pagamento, frete) mora aqui, num lugar
   só. Nenhum outro arquivo precisa ser tocado pra trocar número, chave Pix
   ou valor de frete.
   ========================================================================== */

var ASHFORD_CONFIG = {
  // Formato do WhatsApp: código do país + DDD + número, só dígitos.
  whatsapp: "5591992477891",
  whatsappMensagem: "Olá! Vim pelo site da Ashford e queria tirar uma dúvida.",

  instagram: "ashford_accessories",
  email: "clubashford@gmail.com",

  // ----------------------------------------------------------------------
  // Pagamento
  // ----------------------------------------------------------------------
  // Chave Pix da loja (copia e cola na tela de pagamento). Pode ser CNPJ,
  // e-mail, telefone ou chave aleatória.
  pixChave: "clubashford@gmail.com",
  pixTitular: "Ashford Acessórios",
  // Desconto aplicado no Pix (0.05 = 5%). Use 0 pra não dar desconto.
  pixDesconto: 0.05,

  // Link de pagamento com cartão (Asaas, Mercado Pago, InfinitePay...). É um
  // link fixo gerado no painel do gateway; o valor exato do pedido vai junto
  // na mensagem do WhatsApp. Deixe "" pra esconder a opção de cartão.
  cartaoLink: "",
  cartaoParcelas: 6,

  // ----------------------------------------------------------------------
  // Entrega
  // ----------------------------------------------------------------------
  frete: 24.9,
  freteGratisAcima: 299,
  prazoCapital: "2 a 4 dias úteis",
  prazoDemais: "4 a 9 dias úteis",
};

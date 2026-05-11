import { StoreData } from "../pages/search/models";

const storeDataMock: StoreData = {
  id: 774,
  storeId: 4243,
  slug: "lojas-renner",
  name: "Lojas Renner",
  url: "https://www.lojasrenner.com.br/",
  description:
    "Os cupons em Renner podem variar de 10 a 30% de desconto, sendo direcionados a coleções de produtos, conforme especificado na descrição de cada oferta. O site também possuí Descontos Progressivos, combos e brindes. Outra forma de economizar é através do Cartão Renner.",
  notice: null,
  rules: [
    "O tempo médio para a marca notificar a sua compra e ela aparecer como pendente em sua carteira é de até 7 dias úteis (em média 48h).",
    "Após o registro de compra, seu saldo será confirmado entre 45 e 120 dias (em média 45 dias), a depender da aprovação pelo anunciante.",
    "Cashback (dinheiro de volta) limitado a R$1.000 (mil) reais por compra registrada na carteira digital. Valores superiores serão reajustados para o limite até a data de confirmação pelo marca.",
    "Esvazie o seu carrinho antes de ativar o cashback pela Cuponeria na loja parceira.",
    "É necessário manter todo o processo de compra na mesma janela/aba do navegador onde fizemos o redirecionamento inicialmente.",
    "Compras via aplicativo da marca não possuem cashback.",
    "É recomendado que se utilize o mesmo e-mail e CPF cadastrado na Cuponeria para efetuar sua compra.",
    "Cashback não cumulativo com Programas de Fidelidade.",
    "Cashback não é válido nas compras em listas de casamento.",
    "Cashback válido apenas para o e-commerce, não é válido para as lojas físicas.",
    "A marca parceira é responsável por informar o valor final da compra (sem frete, taxa ou encargos) e nós somos responsáveis por garantir o valor (percentual ou fixo) de cashback ofertado sobre este valor.",
    "O cashback pode ser invalidado ao usar códigos promocionais, vale compras, sites de buscadores de preço, Google Shopping e qualquer outro desconto ou condição especial que não esteja disponível na Cuponeria.",
  ],
  logo: "https://media.cuponeria.com.br/loyalty/content/image/store/lojas-renner/980260a6-lojas-renner-72x72.webp",
  maxDiscount: 70,
  cashback: {
    type: "PERCENTAGE",
    rate: {
      current: 4,
      previous: 3,
    },
  },
  partnerUrl: "https://www.awin1.com/cread.php?awinmid=17801&awinaffid=638665",
  lastRevision: "2024-01-12 17:51:00",
  offerCount: 6,
  offers: [
    {
      id: 11003,
      title: "Cupom de Desconto Renner de 15% OFF em seleção de Sandálias",
      slug: "cupom-de-desconto-renner-de-10-off-em-calcados-da-sapatinho-de-luxo",
      image:
        "https://media.cuponeria.com.br/loyalty/content/image/offer/cupom-de-desconto-renner-de-10-off-em-calcados-da-sapatinho-de-luxo/7a1f7c50-cupom-lojas-334x180.webp",
      discount: 15,
      quantity: 0,
      limit: 0,
      rules:
        "Válido apenas em todos os produtos da através da Alameda Renner.\r\nDesconto não cumulativo com outras ofertas.\r\nO desconto não contempla o frete. \r\nConfira as condições de desconto e frete para o seu CEP no site. \r\nCashback válido em todas as compras no site. \r\nPara registrar o cashback é necessário ser redirecionado para o site a partir do cupom.\r\nSujeito a limite de promoção e alterações sem aviso prévio.\r\nCashback limitado a mil reais por compra (valores maiores serão reajustados para o limite durante o período de validação pelo parceiro).",
      url: "https://www.awin1.com/cread.php?awinmid=17801&awinaffid=638665&platform=dl&ued=https%3A%2F%2Fwww.lojasrenner.com.br%2Flst%2F-%2FN-1ikpfgi",
      badge: "15%",
      renderType: "OFFER_ONLINE",
      pickedCount: 38,
      partnerUrl:
        "https://www.awin1.com/cread.php?awinmid=17801&awinaffid=638665",
      expired: false,
      expirationDate: "2024-01-15 00:00:00",
      cashback: {
        type: "PERCENTAGE",
        rate: {
          current: 3,
        },
      },
      storeId: 4243,
      categoryIds: [107, 1000, 4821, 5806, 5817, 5820, 19267],
    },
    {
      id: 5631,
      title:
        "Cupom de Desconto Renner de 20% OFF na primeira compra acima de R$399",
      slug: "cupom-de-desconto-renner-de-20-off-na-primeira-compra-acima-de-r399",
      image:
        "https://media.cuponeria.com.br/loyalty/content/image/offer/cupom-de-desconto-renner-de-20-off-na-primeira-compra-acima-de-r399/7eff1f85-cupom-lojas-334x180.webp",
      discount: 20,
      quantity: 0,
      limit: 0,
      rules:
        "Válido apenas para itens da lista selecionada nas compras acima de R$399. \r\nDesconto não cumulativo com outras ofertas.\r\nO desconto não contempla o frete. \r\nConfira as condições de desconto e frete para o seu CEP no site. \r\nCashback válido em todas as compras no site. \r\nPara registrar o cashback é necessário ser redirecionado para o site a partir do cupom.\r\nSujeito a limite de promoção e alterações sem aviso prévio.\r\nCashback limitado a mil reais por compra (valores maiores serão reajustados para o limite durante o período de validação pelo parceiro).",
      url: "https://www.awin1.com/cread.php?awinmid=17801&awinaffid=638665&platform=dl&ued=https%3A%2F%2Fwww.lojasrenner.com.br%2Flst%2F-%2FN-1gqg3qeZ18n23yiZoe8q5",
      badge: "20%",
      renderType: "COUPON_ONLINE",
      pickedCount: 2975,
      partnerUrl:
        "https://www.awin1.com/cread.php?awinmid=17801&awinaffid=638665",
      expired: false,
      expirationDate: "2024-02-29 00:00:00",
      cashback: {
        type: "PERCENTAGE",
        rate: {
          current: 5,
          previous: 3,
        },
      },
      storeId: 4243,
      categoryIds: [
        107, 1000, 4821, 5806, 5817, 5819, 5820, 5823, 19267, 39864,
      ],
      code: "PRIMEIRA20",
    },
    {
      id: 5622,
      title:
        "Cupom de Desconto Renner de 10% OFF na primeira compra acima de R$179",
      slug: "cupom-de-desconto-renner-de-10-off-na-primeira-compra-acima-de-r179",
      image:
        "https://media.cuponeria.com.br/loyalty/content/image/offer/cupom-de-desconto-renner-de-10-off-na-primeira-compra-acima-de-r179/3d822be1-cupom-lojas-334x180.webp",
      discount: 10,
      quantity: 0,
      limit: 0,
      rules:
        "Válido apenas para itens da lista selecionada nas compras acima de R$179. \r\nDesconto não cumulativo com outras ofertas.\r\nO desconto não contempla o frete. \r\nConfira as condições de desconto e frete para o seu CEP no site. \r\nCashback válido em todas as compras no site. \r\nPara registrar o cashback é necessário ser redirecionado para o site a partir do cupom.\r\nSujeito a limite de promoção e alterações sem aviso prévio.\r\nCashback limitado a mil reais por compra (valores maiores serão reajustados para o limite durante o período de validação pelo parceiro).",
      url: "https://www.awin1.com/cread.php?awinmid=17801&awinaffid=638665&platform=dl&ued=https%3A%2F%2Fwww.lojasrenner.com.br%2Flst%2F-%2FN-1gqg3qeZ18n23yiZoe8q5",
      badge: "10%",
      renderType: "COUPON_ONLINE",
      pickedCount: 1583,
      partnerUrl:
        "https://www.awin1.com/cread.php?awinmid=17801&awinaffid=638665",
      expired: false,
      expirationDate: "2024-01-31 00:00:00",
      cashback: {
        type: "PERCENTAGE",
        rate: {
          current: 5,
          previous: 3,
        },
      },
      storeId: 4243,
      categoryIds: [
        107, 1000, 4821, 5806, 5817, 5819, 5820, 5823, 19267, 39963,
      ],
      code: "PRIMEIRA10",
    },
    {
      id: 61384,
      title: "Cupom Renner de 20% OFF acima de R$399 em Moda Feminina no site",
      slug: "cupom-renner-de-20-off-acima-de-r399-em-moda-feminina-no-site",
      image:
        "https://media.cuponeria.com.br/loyalty/content/image/offer/cupom-renner-de-20-off-acima-de-r399-em-moda-feminina-no-site/65a91caa-cupom-lojas-334x180.webp",
      discount: 20,
      quantity: 0,
      limit: 0,
      rules:
        "Válido para a primeira compra  acima de R$399, apenas para itens da lista selecionada. \r\nDesconto não cumulativo com outras ofertas.\r\nO desconto não contempla o frete. \r\nConfira as condições de desconto e frete para o seu CEP no site. \r\nCashback válido em todas as compras no site. \r\nPara registrar o cashback é necessário ser redirecionado para o site a partir do cupom.\r\nSujeito a limite de promoção e alterações sem aviso prévio.\r\nCashback limitado a mil reais por compra (valores maiores serão reajustados para o limite durante o período de validação pelo parceiro).",
      url: "https://www.awin1.com/cread.php?awinmid=17801&awinaffid=638665&platform=dl&ued=https%3A%2F%2Fwww.lojasrenner.com.br%2Flst%2F-%2FN-wxqas2Z1hwylc0Z13df56zZxv9uauZ1gqg3qeZ18n23yiZoe8q5",
      badge: "20%",
      renderType: "COUPON_ONLINE",
      pickedCount: 7,
      expired: false,
      expirationDate: "2024-02-29 00:00:00",
      storeId: 4243,
      categoryIds: [107, 1000, 4821, 5806, 5817, 5820, 19267],
      code: "PRIMEIRA20",
    },
    {
      id: 61382,
      title: "Cupom Renner de 20% OFF acima de R$399 em Moda Masculina no site",
      slug: "cupom-renner-de-20-off-acima-de-r399-em-moda-masculina-no-site",
      image:
        "https://media.cuponeria.com.br/loyalty/content/image/offer/cupom-renner-de-20-off-acima-de-r399-em-moda-masculina-no-site/68dcbe5d-cupom-lojas-334x180.webp",
      discount: 20,
      quantity: 0,
      limit: 0,
      rules:
        "Válido para a primeira compra  acima de R$399, apenas para itens da lista selecionada. \r\nDesconto não cumulativo com outras ofertas.\r\nO desconto não contempla o frete. \r\nConfira as condições de desconto e frete para o seu CEP no site. \r\nCashback válido em todas as compras no site. \r\nPara registrar o cashback é necessário ser redirecionado para o site a partir do cupom.\r\nSujeito a limite de promoção e alterações sem aviso prévio.\r\nCashback limitado a mil reais por compra (valores maiores serão reajustados para o limite durante o período de validação pelo parceiro).",
      url: "https://www.awin1.com/cread.php?awinmid=17801&awinaffid=638665&platform=dl&ued=https%3A%2F%2Fwww.lojasrenner.com.br%2Flst%2F-%2FN-wxqas2Z1hwylc0Z13df56zZtglctzZ1gqg3qeZ18n23yiZoe8q5",
      badge: "20%",
      renderType: "COUPON_ONLINE",
      pickedCount: 2,
      expired: false,
      expirationDate: "2024-02-29 00:00:00",
      storeId: 4243,
      categoryIds: [107, 1000, 4821, 5806, 5819, 5820, 19267],
      code: "PRIMEIRA20",
    },
    {
      id: 61388,
      title:
        "Cupom Renner de 20% OFF acima de R$399 em Perfumaria e Acessórios",
      slug: "cupom-renner-de-20-off-acima-de-r399-em-perfumaria-e-acessorios",
      image:
        "https://media.cuponeria.com.br/loyalty/content/image/offer/cupom-renner-de-20-off-acima-de-r399-em-perfumaria-e-acessorios/833cdcbd-cupom-lojas-334x180.webp",
      discount: 20,
      quantity: 0,
      limit: 0,
      rules:
        "Válido para a primeira compra  acima de R$399, apenas para itens da lista selecionada. \r\nDesconto não cumulativo com outras ofertas.\r\nO desconto não contempla o frete. \r\nConfira as condições de desconto e frete para o seu CEP no site. \r\nCashback válido em todas as compras no site. \r\nPara registrar o cashback é necessário ser redirecionado para o site a partir do cupom.\r\nSujeito a limite de promoção e alterações sem aviso prévio.\r\nCashback limitado a mil reais por compra (valores maiores serão reajustados para o limite durante o período de validação pelo parceiro).",
      url: "https://www.awin1.com/cread.php?awinmid=17801&awinaffid=638665&platform=dl&ued=https%3A%2F%2Fwww.lojasrenner.com.br%2Flst%2Fperfumaria-e-cosmeticos%2F-%2FN-y9o0kuZwxqas2Z1hwylc0Z13df56zZ1gqg3qeZ18n23yiZoe8q5",
      badge: "20%",
      renderType: "COUPON_ONLINE",
      pickedCount: 6,
      expired: false,
      expirationDate: "2024-02-29 00:00:00",
      storeId: 4243,
      categoryIds: [
        107, 1000, 3981, 4821, 5806, 5817, 5820, 5823, 19267, 38915,
      ],
      code: "PRIMEIRA20",
    },
  ],
};

export default storeDataMock;

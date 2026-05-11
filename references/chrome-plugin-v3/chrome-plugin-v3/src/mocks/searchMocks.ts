export const mockStore = {
  name: "Americanas",
  slug: "americanas",
  hasCashback: true,
  cashbackValueTypeRate: "P" as "P" | "F",
  cashbackRate: "5",
  cashbackPreviousRate: "5",
  offerCount: 20,
  logo: "https://media.cuponeria.com.br/store/americanas-com/logo/89b2f817-americanas-com-72x72.jpeg",
};

export const mockOffer = {
  id: 1,
  slug: "Marisa",
  title: "Marisa",
  storeName: "Marisa",
  storeLogo:
    "https://media.cuponeria.com.br/store/americanas-com/logo/89b2f817-americanas-com-72x72.jpeg",
  storeSlug: "marisa",
  badgeLabel: "exemple",
  couponCode: "EXEMPLE10",
  rules:
    "Cupom EXCLUSIVO de R$15 OFF + 2% de cashback em compras no site da Marisa",
  url: "",
  cashbackRate: "4",
  cashbackPreviousRate: "2",
  cashbackValueTypeRate: "P" as "P" | "F",
  lastUsed: undefined,
  renderType: "COUPON_ONLINE",
};

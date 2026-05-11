/* eslint-disable @typescript-eslint/no-explicit-any */
import * as StoreService from "../../services/storeService";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line no-underscore-dangle
window._origin = "https://www.cuponeria.com.br";

jest.setTimeout(60000);

const domainMock: StoreService.Domain = {
  storeUrl: "https://www.netshoes.com.br/",
  storeName: "Netshoes",
  slug: "netshoes",
  urlTracker:
    "https://click.linksynergy.com/deeplink?id=JQSp9Z04vB0&mid=43984&murl=https%3A%2F%2Fwww.netshoes.com.br%2F",
  hasCashback: true,
  cashbackValueTypeRate: "P",
  cashbackRate: 6,
  cashbackPreviousRate: 4.5,
  offerCount: 20,
  storeLogo:
    "https://media.cuponeria.com.br/loyalty/content/image/store/netshoes/46824982-netshoes-100x100-72x72.webp",
};

const whitelistedDomainMock = [domainMock];

const whitelistedDomainMockAsString = JSON.stringify(whitelistedDomainMock);

describe("[Store Service]", () => {
  test("Check if domains are being parsed correctly", () => {
    const badFormatDomainMock = [
      {
        id: 557,
        legacyId: 1070,
        slug: "netshoes",
        name: "Netshoes",
        url: "https://www.netshoes.com.br/",
        description:
          'Cupom de desconto Netshoes com até 60% de desconto no site, conforme a descrição de cada oferta. São inúmeras categorias com promoções exclusivas de desconto! Economize através do cashback netshoes e descontos progressivos, como "Ganhe R$25 em compras acima de R$75", ou leve dois por R$99. O frete grátis é indicado pelo selo nos produtos do site.',
        notice: null,
        logo: "https://media.cuponeria.com.br/loyalty/content/image/store/netshoes/46824982-netshoes-100x100-72x72.webp",
        maxDiscount: 80,
        tags: "ecommerce,esportes,calçados,produtos,varejo,online,promoção,qualidade,entrega,variedade",
        cashback: {
          type: "PERCENTAGE" as const,
          rate: {
            current: 6,
            previous: 4.5,
          },
        },
        partnerUrl:
          "https://click.linksynergy.com/deeplink?id=JQSp9Z04vB0&mid=43984&murl=https%3A%2F%2Fwww.netshoes.com.br%2F",
        lastRevision: "2025-08-06 15:01:17",
        offersCount: 20,
      },
    ];

    const goodFormat = StoreService.parseWhitelistDomain(badFormatDomainMock);

    expect(goodFormat).toStrictEqual(whitelistedDomainMock);
  });

  test("Check if a domain is being matched correctly", async () => {
    const storeCorrect = await StoreService.getStoreByUrl(
      whitelistedDomainMockAsString,
      "https://netshoes.com.br"
    );

    const storeWrong = await StoreService.getStoreByUrl(
      whitelistedDomainMockAsString,
      "https://americanas.com.br"
    );

    expect(storeCorrect).toBeTruthy();
    expect(storeWrong).not.toBeTruthy();
  });

  test("Check if a slug is being matched correctly", async () => {
    const storeCorrect = await StoreService.getWhitelistedStoreBySlug(
      whitelistedDomainMockAsString,
      "netshoes"
    );

    const storeWrong = await StoreService.getWhitelistedStoreBySlug(
      whitelistedDomainMockAsString,
      "americanas-com"
    );

    expect(storeCorrect).toBeTruthy();
    expect(storeWrong).not.toBeTruthy();
  });

  test("Check if a domain object is being matched correctly", async () => {
    const storeCorrect = await StoreService.getStoreBySlug(domainMock.slug);

    expect(storeCorrect).toBeTruthy();
  });
});

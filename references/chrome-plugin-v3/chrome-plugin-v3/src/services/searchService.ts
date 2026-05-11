import { sendMessageFromPageToBackground } from "../chrome/messaging";
import { RequestService as Request } from "./requestService";

type StoreResponse = {
  id: number;
  name: string;
  slug: string;
  logo: string;
  maxDiscount?: number;
  offerCount?: number;
  cashback?: {
    rate: {
      current?: number;
      previous?: number;
    };
    previousRate?: number;
    type: string;
    display: string;
  };
};

type OfferResponse = {
  id: number;
  name: string;
  title?: string;
  slug: string;
  image: string;
  rules?: string;
  code?: string;
  renderType?: string;
  labels?: [
    {
      text: string;
    }
  ];
  badge?: string;
  cashback?: {
    rate: {
      current?: number;
      previous?: number;
    };
    previousRate?: number;
    type: string;
    display: string;
  };
  hideCodeOnLoad?: boolean;
  store: StoreResponse;
};

interface ResponseNew {
  stores?: StoreResponse[];
  offers?: OfferResponse[];
  suggestions?: OfferResponse[];
}

export interface StoreResult {
  name: string;
  slug: string;
  hasCashback: boolean;
  cashbackValueTypeRate: "P" | "F";
  cashbackRate: string;
  cashbackPreviousRate: string;
  offerCount: number;
  logo: string;
}

// TODO remove badgeLabe for labels using getBadges
export interface OfferResult {
  id?: number;
  slug: string;
  title: string;
  storeName: string;
  storeLogo: string;
  storeSlug: string;
  badgeLabel: string;
  labels?: {
    text: string;
  }[];
  code?: string | null;
  rules: string;
  url: string;
  cashbackRate: string;
  cashbackPreviousRate: string;
  cashbackValueTypeRate: string;
  hideCodeOnLoad?: boolean;
  renderType?: string;
  lastUsed?: string;
}

export interface SearchResult {
  stores: StoreResult[];
  offers: OfferResult[];
}

const parseToStoreResult = (
  stores?: StoreResponse[],
  offers?: OfferResponse[]
): StoreResult[] => {
  const storesAdjusted: StoreResult[] = [];

  stores?.forEach((x) => {
    storesAdjusted.push({
      ...x,
      cashbackValueTypeRate: x?.cashback?.type === "PERCENTAGE" ? "P" : "F",
      cashbackRate: x.cashback?.rate?.current?.toString() ?? "0",
      cashbackPreviousRate: x.cashback?.previousRate?.toString() ?? "0",
      offerCount: offers?.filter((y) => y.store.slug === x.slug)?.length ?? 0,
      hasCashback: (x?.cashback?.rate?.current ?? 0) > 0,
    });
  });

  return storesAdjusted;
};

const parseOfferToResult = (offers?: OfferResponse[]): OfferResult[] => {
  const offersAdjusted: OfferResult[] = [];

  if (offers) {
    offers?.forEach((x) => {
      const host = `${
        process.env.REACT_APP_ENV_TYPE === "development" ? "web" : "www"
      }.${process.env.REACT_APP_HOSTNAME}`;

      offersAdjusted.push({
        ...x,
        title: x.title as string,
        storeName: x.store.name,
        storeLogo: x.store.logo,
        storeSlug: x.store.slug,
        badgeLabel: x.badge ?? "",
        rules: x.rules as string,
        url: `https://${host}.com.br/cupom-desconto/${x.store.slug}?offerPick=${x.slug}`,
        cashbackRate: x.cashback?.rate?.current?.toString() ?? "0",
        cashbackPreviousRate:
          (x.cashback?.rate?.previous?.toString() as string) ?? "0",
        cashbackValueTypeRate:
          x.cashback?.type === "PERCENTAGE" ? "P" : ("F" as string),
      });
    });
  }

  return offersAdjusted;
};

// search term from background
export const searchByTermFromBackground = ({ term }: { term: string }) =>
  new Promise<SearchResult>((resolve, reject) => {
    if (!term) {
      resolve({
        offers: [],
        stores: [],
      });
      return;
    }
    new Request({
      path: `/loyalty/cuponeria/extension/search/${term}`,
      version: "4.0",
    })
      .get()
      .then((response) => {
        const { stores, offers } = response?.data as ResponseNew;

        const result: SearchResult = {
          stores: parseToStoreResult(stores, offers),
          offers: parseOfferToResult(offers),
        };

        resolve(result);
      })
      .catch(reject);
  });

/* istanbul ignore next */
export const searchByTerm = (term: string) =>
  sendMessageFromPageToBackground({
    type: "searchByTerm",
    data: {
      term,
    },
  });

export const getSuggestedOffersFromBackground = () =>
  new Promise<OfferResult[]>((resolve, reject) => {
    new Request({
      path: `/loyalty/cuponeria/extension/search/12345&fields[]=suggestions`,
      version: "4.0",
    })
      .get()
      .then((response) => {
        const { suggestions } = response?.data as ResponseNew;

        const result: OfferResult[] = parseOfferToResult(suggestions);

        resolve(result);
      })
      .catch(reject);
  });

/* istanbul ignore next */
export const getSuggestedOffers = () =>
  sendMessageFromPageToBackground({
    type: "getSuggestedOffers",
  });

export default {};

import { sendMessageFromPageToBackground } from "../chrome/messaging";
import { getFromStorage, setToStorage } from "../chrome/storage";
import { RequestService as Request } from "./requestService";
import { getCurrentChannel } from "./userService";
import { log } from "./logService";
import findBestMatchingStore from "../utils/findBestMatchingStore";
import { OfferModel, StoreModel } from "../pages/search/models";

/* eslint-disable @typescript-eslint/no-explicit-any */
type KeyPar = {
  [key: string]: unknown;
};

/**
 * @deprecated
 * ? logo instead of storeLogo, name instead of storeName, hasCashback comes from cashback.rate
 * ! will be removed when all routes return same type
 */
export interface Domain {
  storeUrl: string;
  storeName: string;
  name?: string;
  slug: string;
  urlTracker: string;
  priority?: number;
  hasCashback: boolean;
  activatedCashbackText?: string | undefined;
  cashbackValueTypeRate: "P" | "F";
  cashbackRate: number;
  cashbackPreviousRate: number;
  offerCount: number;
  storeLogo: string;
  logo?: string;
  offers?: KeyPar[];
}

export interface StoreResult {
  storeUrl: string;
  storeName: string;
  slug: string;
  urlTracker?: string;
  priority?: number;
  hasCashback: boolean;
  activatedCashbackText?: string;
  cashbackValueTypeRate: "P" | "F";
  cashbackRate: number;
  cashbackPreviousRate: number;
  offerCount: number;
  storeLogo: string;
  offers?: KeyPar[];
}

interface StoreMessagePayload {
  [name: string]: string | number;
}

interface WhitelistedResponse {
  id: number;
  legacyId: number;
  slug: string;
  name: string;
  url: string;
  description: string;
  notice: string | null;
  rules?: string[];
  logo: string;
  maxDiscount: number;
  tags: string;
  cashback: {
    type: "PERCENTAGE" | "CURRENCY";
    rate: {
      current: number;
      previous: number | null;
    };
  };
  partnerUrl: string;
  lastRevision: string;
  offersCount: number;
}

export const parseWhitelistDomain = (data: WhitelistedResponse[]) => {
  const whitelistedDomain: StoreResult[] = [];

  data.forEach((domainData) => {
    const domain: StoreResult = {
      storeUrl: domainData.url as string,
      storeName: domainData.name as string,
      slug: domainData.slug as string,
      urlTracker: domainData.partnerUrl as string,
      hasCashback: !!domainData.cashback?.rate,
      cashbackValueTypeRate:
        domainData.cashback?.type === "PERCENTAGE" ? "P" : "F",
      cashbackRate: domainData.cashback?.rate.current as number,
      cashbackPreviousRate: domainData.cashback?.rate?.previous ?? 0,
      offerCount: domainData.offersCount as number,
      storeLogo: domainData.logo as string,
    };

    whitelistedDomain.push(domain);
  });

  setToStorage({
    whitelistedStores: JSON.stringify(whitelistedDomain),
  });

  log("[Store] Whitelisted stores got successfully.");

  return whitelistedDomain;
};

type StoreDataType = {
  offers: OfferModel[];
  store: StoreModel;
};

/**
 * * gets the store to match the current url
 */
export const getStoreByUrl = (
  whitelistedStores: string | undefined,
  host: string
): Promise<Domain | undefined> => {
  const listOfStores: Domain[] = JSON.parse(
    whitelistedStores || /* istanbul ignore next */ "[]"
  );

  // clean the host to match the store url
  const hostAsUrl = new URL(host).hostname.replace(
    /www\.|\.com\.br|\.com/gi,
    ""
  );

  const selectedStore = findBestMatchingStore(hostAsUrl, listOfStores);
  return Promise.resolve(selectedStore);
};

export const getWhitelistedStoreBySlug = (
  whitelistedStores: string | undefined,
  slug: string
) =>
  new Promise<Domain | undefined>((resolve) => {
    const listOfStores: Domain[] = JSON.parse(
      whitelistedStores || /* istanbul ignore next */ "[]"
    );

    const selectedStore = listOfStores.find((x) => x.slug === slug);

    resolve(selectedStore);
  });

const parseOffers = (data: StoreDataType) => {
  if (!data) return { offerCount: 0 };
  const { offers, store } = data;
  const activeOffers = offers.filter((offer) => !offer.expired);
  return {
    ...store,
    offerCount: activeOffers.length ?? 0,
    storeName: store.name,
    storeSlug: store.slug,
    cashbackRate: store.cashback?.rate?.current?.toString() ?? "0",
    cashbackPreviousRate:
      (store.cashback?.rate?.previous?.toString() as string) ?? "0",
    cashbackValueTypeRate:
      store.cashback?.type === "PERCENTAGE" ? "P" : ("F" as string),
    offers: activeOffers.map((offer) => ({ ...offer })),
  };
};

/* istanbul ignore next */
export const getStoreList = () =>
  getFromStorage("whitelistedStores").then(
    (storage) =>
      new Promise((resolve) => {
        const storeList = JSON.parse(storage.whitelistedStores || "[]");
        resolve(storeList);
      })
  );

export const getStoreBySlug = (slug?: string) =>
  new Promise((resolve, reject) => {
    /* istanbul ignore if */
    if (!slug) {
      resolve(null);
      return;
    }

    new Request({
      path: `/loyalty/cuponeria/extension/content/store`,
      params: {
        slug,
      },
      version: "4.0",
      cacheKey: `store_${slug}`,
      cacheTime: 60 * 1000,
    })
      .get()
      .then((response) => resolve(parseOffers(response?.data as StoreDataType)))
      .catch(reject);
  });

/* istanbul ignore next */
export const getStoreInfo = (host: string) =>
  new Promise<Domain>((resolve, reject) => {
    getFromStorage("whitelistedStores")
      .then(({ whitelistedStores }) => getStoreByUrl(whitelistedStores, host))
      .then((store) => getStoreBySlug(store?.slug))
      .then((store) => resolve(store as Domain))
      .catch(reject);
  });

/* istanbul ignore next */
export const getStoreInfoBySlug = (slug: string) =>
  new Promise((resolve, reject) => {
    getFromStorage("whitelistedStores")
      .then(({ whitelistedStores }) =>
        getWhitelistedStoreBySlug(whitelistedStores, slug)
      )
      .then((store) => getStoreBySlug(store?.slug))
      .then(resolve)
      .catch(reject);
  });

/* istanbul ignore next */
export const getStoreForHost = (host: string) =>
  new Promise((resolve) => {
    getFromStorage("whitelistedStores")
      .then(({ whitelistedStores }) => getStoreByUrl(whitelistedStores, host))
      .then(resolve);
  });

/* istanbul ignore next */
export const updateWhitelistedStores = () =>
  new Promise((resolve, reject) => {
    getFromStorage("whitelistedDomains", true)
      .then(({ whitelistedDomains }) => {
        if (whitelistedDomains) {
          parseWhitelistDomain(JSON.parse(whitelistedDomains));
        } else {
          getCurrentChannel().then(() => {
            new Request({
              path: "/loyalty/cuponeria/store/listWithContent",
              version: "4.2",
            })
              .get()
              .then((response) => {
                setToStorage(
                  {
                    whitelistedDomains: JSON.stringify(response.data),
                  },
                  60 * 60 * 6 * 1000
                );
                parseWhitelistDomain(response.data as []);
              });
          });
        }
      })
      .then(resolve)
      .catch(reject);
  });

/* istanbul ignore next */
export const getStoreFromBackgroundBySlug = (slug: string) =>
  sendMessageFromPageToBackground<StoreMessagePayload>({
    type: "getStoreInfoBySlug",
    data: {
      slug,
    },
  });

/* istanbul ignore next */
export const getStoreListFromBackground = () =>
  sendMessageFromPageToBackground<StoreMessagePayload>({
    type: "getStoreList",
    data: {},
  });

export default {};

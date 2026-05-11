import { sendMessageFromPageToBackground } from "../chrome/messaging";
import {
  getFromStorage,
  removeFromStorage,
  setToStorage,
} from "../chrome/storage";
import { log } from "./logService";
import { closeTab, navigateTo, setEnabledIcon } from "./navigationService";
import { getStoreByUrl } from "./storeService";

interface StoreMessagePayload {
  [name: string]: string | number;
}

/* istanbul ignore next */
export const getCashbackStateBySlug = (slug: string) =>
  sendMessageFromPageToBackground<StoreMessagePayload>({
    type: "getCashbackStateBySlug",
    data: { slug },
  }) as Promise<boolean>;

/* istanbul ignore next */
export const getCashbackStateBySlugFromBackground = (data: { slug: string }) =>
  new Promise<boolean>((resolve) => {
    const key = `cashbackActivated_${data.slug}`;

    getFromStorage(key)
      .then((storedData) => !!storedData[key])
      .then(resolve);
  });

/* istanbul ignore next */
export const enableCashbackBySlug = (slug: string) => {
  const dataToBeStored: { [key: string]: string } = {};
  dataToBeStored[`cashbackActivated_${slug}`] = "true";
  setToStorage(dataToBeStored);
  log(`[Cashback] Cashback enabled: ${slug}`);
};

/* istanbul ignore next */
export const disableCashbackBySlug = (slug: string) => {
  removeFromStorage(`cashbackActivated_${slug}`);
  log(`[Cashback] Cashback disabled: ${slug}`);
};

/* istanbul ignore next */
export const disableAllCashbacks = () => {
  getFromStorage(undefined).then((data) => {
    if (!data) {
      return;
    }

    const matchList = [/cashbackActivated/];

    Object.keys(data).forEach((key) => {
      if (matchList.some((x) => x.test(key))) {
        removeFromStorage(key);
      }
    });

    log("[Cashback] All cashbacks disabled.");
  });
};

/* istanbul ignore next */
const disableCashbackInBroadcastedTab = (
  active: boolean,
  tab: chrome.tabs.Tab,
  slug: string | undefined,
  cashbackRate: number | undefined,
  cashbackValueTypeRate: string | undefined
) => {
  if (active) {
    let cashbackRateValue = `${cashbackRate}`.replace(".", ",");

    if (cashbackValueTypeRate === "F") {
      cashbackRateValue = `R$ ${cashbackRateValue}`;
    } else {
      cashbackRateValue = `${cashbackRateValue}%`;
    }

    closeTab(tab.id || 0);

    navigateTo(tab.id || 0, "/cashback/status/deactivated", {
      cashbackRate: cashbackRateValue,
      slug: slug || "",
    });

    disableCashbackBySlug(slug || "");

    setEnabledIcon(0, tab?.id || 0);
  }
};

/* istanbul ignore next */
const broadcastCashbackDeactivated = () => {
  chrome.tabs.query({}).then((tabs) => {
    tabs.forEach((tab) => {
      let cashbackRate: number | undefined = 0;
      let cashbackValueTypeRate: string | undefined = "";
      let slug: string | undefined = "";

      getFromStorage("whitelistedStores")
        .then(({ whitelistedStores }) =>
          getStoreByUrl(whitelistedStores, tab?.url || "")
        )
        .then((store) => {
          cashbackRate = store?.cashbackRate;
          cashbackValueTypeRate = store?.cashbackValueTypeRate;
          slug = store?.slug || "";

          return getCashbackStateBySlugFromBackground({
            slug,
          });
        })
        .then((active) =>
          disableCashbackInBroadcastedTab(
            active,
            tab,
            slug,
            cashbackRate,
            cashbackValueTypeRate
          )
        );
    });
  });
};

/* istanbul ignore next */
export const checkForCashbackInvalidation = (tab?: chrome.tabs.Tab) => {
  const matchList = [/meliuz.com/, /cuponomia.com/];

  if (matchList.some((x) => x.test(tab?.url || ""))) {
    broadcastCashbackDeactivated();
    log(`[Cashback] Disabling cashbacks because user accessed: ${tab?.url}`);
  }
};

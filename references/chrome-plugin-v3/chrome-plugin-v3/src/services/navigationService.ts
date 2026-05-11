/* istanbul ignore file */
import {
  sendMessageFromBackgroundToContentScript,
  sendMessageFromPageToBackground,
} from "../chrome/messaging";
import {
  getFromStorage,
  removeFromStorage,
  setToStorage,
} from "../chrome/storage";
import { getStoreInfo, getStoreList } from "./storeService";
import { openFloatingIfSupported } from "./backgroundService";
import { getCurrentChannel } from "./userService";
import { log } from "./logService";

export const switchToTab = (tabId: number) =>
  chrome.tabs.update(tabId, {
    active: true,
  });

export const navigateTo = (
  tabId: number,
  path: string,
  query?: { [key: string]: string | number | boolean }
) => {
  const builtPath = `${path}?${new URLSearchParams(
    query as { [key: string]: string }
  )}`;
  log(`[Navigation] Requesting navigation to ${path}`, { tabId });
  sendMessageFromBackgroundToContentScript(tabId, {
    type: "navigateTo",
    data: builtPath,
  });
};

/**
 * Open the welcome page in a new tab.
 */
/* istanbul ignore next */
export const openWelcomePage = () =>
  new Promise(() => {
    const host = process.env.REACT_APP_HOSTNAME;
    const url = `https://www.${host}.com.br/extensao-instalada`;
    // open new tab
    chrome.tabs
      .create({
        url,
      })
      .then(() => {
        log("[User] Opening welcome page.");
      });
  });

/**
 * Closes the popup inside a tab.
 *
 * @param tabId Chrome's tab id.
 */
/* istanbul ignore next */
export const closeTab = (tabId: number) => {
  removeFromStorage(`isTabOpen_${tabId}`);

  sendMessageFromBackgroundToContentScript(tabId, {
    type: "close",
  });
};

export const dispenseExtension = (
  slug: string,
  time: string,
  tabId: number
) => {
  const now = new Date().getTime();
  let expiryTime = now + Number.MAX_SAFE_INTEGER; // "forever"

  if (time === "24hs") {
    expiryTime = now + 1000 * 60 * 60 * 24; // 24hs
  }

  const dataToBeStored: { [key: string]: string } = {};
  dataToBeStored[`dispense_${slug}`] = `${expiryTime}`;
  setToStorage(dataToBeStored);

  closeTab(tabId);
};

/* istanbul ignore next */
export const minimizeTab = (tabId: number) => {
  closeTab(tabId);

  chrome.tabs.get(tabId).then((tab) => {
    openFloatingIfSupported(tab);
  });
};

/**
 * Resizes the current popup.
 *
 * @param tabId Chrome's tab id.
 * @param data Size payload
 * @param data.width Width in pixels or percent in horizontal width.
 * @param data.height Height in pixels or percent in vertical height.
 */
export const resizePopup = (
  tabId: number,
  { width = "", height = "", clipPath = "" }
) => {
  sendMessageFromBackgroundToContentScript(tabId, {
    type: "resize",
    data: { width, height, clipPath },
  });
};

/* instanbul ignore next */
/**
 * Show navigation bar icon.
 *
 * @param counter Amount of offers
 * @param tabId Chrome's tab id
 * @param variant Show variant icon?
 */
export const setEnabledIcon = (
  counter: number,
  tabId: number,
  variant?: boolean
) => {
  let path = "/logo128.png";
  const text = counter === 0 ? "" : `${counter}`;

  if (variant) {
    path = "/logo128-green.png";
  }

  getCurrentChannel().then((_channel) => {
    if (_channel !== "cuponeria-ext") {
      path = "/logo-alt.png";
    }

    chrome.action.setIcon({
      path,
      tabId,
    });
    chrome.action.setBadgeBackgroundColor({ color: "#06ab5c", tabId });
    chrome.action.setBadgeText({ text, tabId });
  });
};

/* instanbul ignore next */
/**
 * Show disabled icon.
 *
 * @param tabId Chrome's tab id
 */
export const setDisabledIcon = (tabId: number) => {
  chrome.action.setIcon({
    path: "/logo128-grayscale.png",
    tabId,
  });
  chrome.action.setBadgeText({ text: "", tabId });
};

/**
 * Check tab Url
 *
 * @param tab Chrome's tab.
 */
export const isGoogleSearchUrl = (tab?: chrome.tabs.Tab) => {
  const url = tab?.url;

  if (url?.includes("google.com") && url?.includes("search?q=")) {
    return true;
  }

  return false;
};

export const checkIfIsGoogleSearch = (tab?: chrome.tabs.Tab) => {
  if (isGoogleSearchUrl(tab)) {
    getStoreList().then((storeList) =>
      sendMessageFromBackgroundToContentScript(tab?.id || 0, {
        type: "injectGoogleSnippets",
        data: {
          stores: storeList,
        },
      })
    );
  }
};

/* instanbul ignore next */
/**
 * Open store page
 *
 * @param tab Chrome's tab object
 */
export const openStorePage = (tab: chrome.tabs.Tab) => {
  getStoreInfo(tab.url || "").then((store) => {
    if (!store) {
      navigateTo(tab.id || 0, "/store/noStore");
    } else if (store.slug) {
      navigateTo(tab.id ?? 0, `/store/${store?.slug}`);
    }

    const dataToBeStored: { [key: string]: string } = {};
    dataToBeStored[`isTabOpen_${tab?.id}`] = "true";
    setToStorage(dataToBeStored);
  });
};

/* instanbul ignore next */
/**
 * Open tutorial page
 *
 * @param tab Chrome's tab object
 */
export const openTutorialPage = (tab: chrome.tabs.Tab) => {
  getStoreInfo(tab.url || "").then((store) => {
    navigateTo(tab?.id || 0, `/first-tutorial`, { slug: store.slug });

    const dataToBeStored: { [key: string]: string } = {};
    dataToBeStored[`isTabOpen_${tab?.id}`] = "true";
    setToStorage(dataToBeStored);
  });
};

/* instanbul ignore next */
/**
 * Says if it is the first time that the extension is being opened
 *
 */
export const isFirstTimeOpening = (): Promise<boolean> =>
  new Promise((resolve) => {
    getFromStorage("hasRunOnce").then(({ hasRunOnce }) => {
      resolve(!hasRunOnce);
      setToStorage({ hasRunOnce: "true" });
    });
  });

/* instanbul ignore next */
/**
 * Says if it is the first time that the extension is being opened
 *
 */
export const isFirstTimeOpeningFromBackground = (): Promise<boolean> =>
  sendMessageFromPageToBackground({
    type: "isFirstTimeOpening",
  }) as Promise<boolean>;

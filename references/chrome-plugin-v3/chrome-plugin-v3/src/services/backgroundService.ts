/* istanbul ignore file */
import { MessageListener } from "../chrome/messaging";
import { getFromStorage, removeFromStorage } from "../chrome/storage";
import AnalyticsService from "./analyticsService";
import { authenticateUser } from "./authenticationService";
import {
  checkForCashbackInvalidation,
  disableAllCashbacks,
  enableCashbackBySlug,
  getCashbackStateBySlugFromBackground,
} from "./cashbackService";
import { log } from "./logService";
import {
  closeTab,
  isFirstTimeOpening,
  navigateTo,
  openStorePage,
  openTutorialPage,
  minimizeTab,
  dispenseExtension,
  openWelcomePage,
  resizePopup,
  setDisabledIcon,
  setEnabledIcon,
  switchToTab,
  checkIfIsGoogleSearch,
} from "./navigationService";
import {
  getSuggestedOffersFromBackground,
  searchByTermFromBackground,
} from "./searchService";
import {
  Domain,
  getStoreInfo,
  getStoreInfoBySlug,
  getStoreList,
  updateWhitelistedStores,
} from "./storeService";
import {
  getCurrentChannel,
  getUserBalance,
  openWalletFromBackground,
  openWindowFromBackground,
  redirectToSiteFromBackground,
} from "./userService";

/**
 * Message type mapping.
 *
 * Return the mapping between commands and
 * functions for messages between page and background.
 */
export const getMessagesTypes: MessageListener = {
  sendAnalyticsRequest: (data) =>
    AnalyticsService.sendAnalyticsRequest(data.data.params, data.data.payload),

  getStoreInfoBySlug: (data) => getStoreInfoBySlug(data.data.slug),

  // TODO: rename to closeTab
  closeWindow: ({ tabId }) => closeTab(tabId),

  minimizeWindow: ({ tabId }) => minimizeTab(tabId),

  getStoreList: () => getStoreList(),

  redirectToSiteFromBackground: (data) =>
    redirectToSiteFromBackground(data.data, data.tabId),

  switchToTab: (data) => switchToTab(data.data.tabId),

  getUserBalance: () => getUserBalance(),

  openWindowFromBackground: (data) => openWindowFromBackground(data.data),

  openWallet: () => openWalletFromBackground(),

  searchByTerm: (data) => searchByTermFromBackground(data.data),

  dispenseExtension: (data) =>
    dispenseExtension(data.data.slug, data.data.time, data.tabId),

  getSuggestedOffers: () => getSuggestedOffersFromBackground(),

  resize: (data) => resizePopup(data.tabId, data.data),

  searchGoogle: (data) => checkIfIsGoogleSearch(data.data),

  getCashbackStateBySlug: (data) =>
    getCashbackStateBySlugFromBackground(data.data),

  isFirstTimeOpening: () => isFirstTimeOpening(),

  getCurrentChannel: () => getCurrentChannel(),
};

/**
 * Actions performed when an install happens.
 *
 * @param {reason} details Chrome install reason
 */
export const onInstalledEvent = ({
  reason,
}: chrome.runtime.InstalledDetails) => {
  if (reason === chrome.runtime.OnInstalledReason.UPDATE) {
    AnalyticsService.sendEvent("update", {}, true);
  }

  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    AnalyticsService.sendEvent("install", {}, true);

    openWelcomePage();
  }

  chrome.runtime.setUninstallURL(
    "https://docs.google.com/forms/d/e/1FAIpQLScrNkuVMJsmbOLXs44oug3iB8cql4q2PQQmMNTDoYhkOPuM_g/viewform"
  );

  log("[App] Application has been installed.", { reason });
};

const cleanUpStorage = () => {
  getFromStorage(undefined).then((data) => {
    if (!data) {
      return;
    }

    const matchList = [/store_/, /executeAfter/, /hashbuild/];

    Object.keys(data).forEach((key) => {
      if (matchList.some((x) => x.test(key))) {
        removeFromStorage(key);

        log(`[Storage] Key removed: ${key}`);
      }
    });
  });
};

/**
 * Event fired every time the application is started.
 */
export const onApplicationStart = () => {
  authenticateUser();
  updateWhitelistedStores();
  disableAllCashbacks();
  cleanUpStorage();
};

/**
 * Called to clear a login window when needed.
 *
 * @param tab Chrome tab object.
 */
const clearRunningLoginWindow = (tab: chrome.tabs.Tab) => {
  getFromStorage("windowRunningLogin").then(({ windowRunningLogin }) => {
    if (`${tab.windowId}` === windowRunningLogin) {
      chrome.windows.remove(tab.windowId);
      removeFromStorage("windowRunningLogin");
    }
  });
};

/**
 * Called to execute a defined command after a page completed event.
 *
 * @param tab Chrome tab object.
 */
const executeAfterCommand = (tab: chrome.tabs.Tab) => {
  getFromStorage("executeAfter").then(({ executeAfter }) => {
    if (executeAfter) {
      const command = JSON.parse(executeAfter);

      redirectToSiteFromBackground(
        command as unknown as {
          path: string;
          mustSwitchTabs: boolean;
        },
        tab.id || 0
      );
      removeFromStorage("executeAfter");
    }
  });
};

const canOpenFloating = (_slug: string) =>
  new Promise<boolean>((resolve) => {
    const key = `dispense_${_slug}`;
    getFromStorage(key).then((data) => {
      const canShow = Date.now() > parseInt(data[key] || `0`, 10);

      if (!canShow) {
        log(
          `[Store] Extension suspended in this website. Will be shown again at ${data[key]}`
        );
      } else {
        removeFromStorage(key);
      }

      resolve(canShow);
    });
  });

// uses storeInfo
export const openFloatingIfSupported = (tab?: chrome.tabs.Tab) => {
  getStoreInfo(tab?.url || "").then((store) => {
    if (!store) {
      setDisabledIcon(tab?.id || 0);
      return;
    }

    const {
      offerCount,
      slug,
      storeName,
      cashbackRate,
      cashbackValueTypeRate,
      cashbackPreviousRate,
    } = store as Domain;

    removeFromStorage(`isTabOpen_${tab?.id}`);

    const cashbackAtivatedTabKey = `mustShowActivatedCashbackTab_${tab?.id}`;

    Promise.all([
      getCashbackStateBySlugFromBackground({ slug }),
      getFromStorage(cashbackAtivatedTabKey),
      canOpenFloating(slug),
    ]).then((data) => {
      const isCashbackActivated = data[0];
      const showCashbackInTab = data[1][cashbackAtivatedTabKey];
      const canShowFloating = data[2];

      setEnabledIcon(offerCount, tab?.id || 0, isCashbackActivated);
      if (showCashbackInTab) {
        removeFromStorage(cashbackAtivatedTabKey);
        let path = `/cashback/status/activated`;

        if (cashbackRate === 0 || !cashbackRate) {
          path = `/store/${slug}`;
        }

        navigateTo(tab?.id || 0, path, {
          slug,
          cashbackRate,
          cashbackValueTypeRate,
        });
      }

      if (canShowFloating && !showCashbackInTab) {
        navigateTo(tab?.id || 0, "/floating/", {
          slug,
          offerCount,
          storeName,
          cashbackRate,
          cashbackValueTypeRate,
          cashbackPreviousRate,
          isCashbackActivated,
        });
      }
    });
  });
};

const checkForAuthentication = (tab?: chrome.tabs.Tab) =>
  new Promise((resolve) => {
    const cpnrHost = process.env.REACT_APP_HOSTNAME;

    if (cpnrHost && tab?.url?.includes(`${cpnrHost}.com.br`)) {
      authenticateUser().then((result) => {
        updateWhitelistedStores();

        resolve(result);
      });
    }
  });

const supposeIfHasLogged = (tab?: chrome.tabs.Tab) => {
  const cpnrHost = process.env.REACT_APP_HOSTNAME;

  if (cpnrHost && tab?.url?.includes(`${cpnrHost}.com.br`)) {
    clearRunningLoginWindow(tab);
    executeAfterCommand(tab);
  }
};

const checkForCashbackRedirects = (tab?: chrome.tabs.Tab) => {
  const host = `${
    process.env.REACT_APP_ENV_TYPE === "development" ? "web" : "www"
  }.${process.env.REACT_APP_HOSTNAME}`;

  const cpnrHostRedirect = `https://${host}.com.br/redirect/(?=\\S*['-])([a-zA-Z0-9-]+)`;

  const redirectMatch = tab?.url?.match(cpnrHostRedirect);

  const storeSlug = redirectMatch?.[1];

  if (!storeSlug) {
    return;
  }

  enableCashbackBySlug(storeSlug);
};

/**
 * Fired when a page completed event is generated.
 *
 * @param tab Chrome tab object.
 */
export const onPageCompletedEvent = (tab?: chrome.tabs.Tab) => {
  checkIfIsGoogleSearch(tab);
  openFloatingIfSupported(tab);
  checkForAuthentication(tab).then((authenticated) => {
    if (authenticated !== false) {
      supposeIfHasLogged(tab);
    }
  });
  checkForCashbackRedirects(tab);
  checkForCashbackInvalidation(tab);
};

/**
 * Fired when a page loading event is generated.
 *
 * @param tab Chrome tab object.
 */
// TODO: Remove lint
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const onPageLoadingEvent = (tab?: chrome.tabs.Tab) => {
  // todo
};

/**
 * Fired when the timer is called by Chrome.
 * @param name The alarm's name
 */
export const onTimerFired = (name: string) => {
  if (name === "every15min") {
    getStoreList();
  }

  if (name === "every60min") {
    updateWhitelistedStores();
  }
};

/**
 * Fired when the icon is clicked.
 */
export const onIconClickListener = (tab: chrome.tabs.Tab) => {
  resizePopup(tab?.id || 0, {
    width: "380px",
    height: "100vw",
    clipPath: "inset(50px 0px 30px)",
  });

  isFirstTimeOpening().then((isFirstTime) => {
    if (isFirstTime) {
      closeTab(tab.id || 0);
      openTutorialPage(tab);
      return;
    }

    const tabOpenKey = `isTabOpen_${tab.id}`;

    getFromStorage(tabOpenKey).then((data) => {
      if (data[tabOpenKey] === "true") {
        closeTab(tab.id || 0);
      } else {
        closeTab(tab.id || 0);
        openStorePage(tab);
      }
    });
  });
};

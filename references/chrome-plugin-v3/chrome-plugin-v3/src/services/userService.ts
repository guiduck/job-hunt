import {
  sendMessageFromBackgroundToContentScript,
  sendMessageFromPageToBackground,
} from "../chrome/messaging";
import { RequestService as Request } from "./requestService";
import { isUserLogged } from "./authenticationService";
import { getFromStorage, setToStorage } from "../chrome/storage";
import { convertNumberToCurrency } from "../utils/helper";
import { log } from "./logService";

/**
 * Request a new login popup to be open.
 */
/* istanbul ignore next */
export const redirectToLogin = (executeAfter?: {
  [key: string]: string | boolean;
}) => {
  const path = `/?login=extensao`;
  sendMessageFromPageToBackground({
    type: "openWindowFromBackground",
    data: { path, executeAfter },
  });
};

/**
 * Get the current channel
 */
/* istanbul ignore next */
export const getCurrentChannel = () =>
  new Promise((resolve) => {
    getFromStorage("loginOrigin").then(({ loginOrigin }) => {
      let currentChannel = "cuponeria-ext";

      if (loginOrigin !== "cuponeria" && loginOrigin) {
        // em caso de extensão WL, deve-se mudar aqui o channel.
        currentChannel = "cuponeria-elo-ext";
      }

      resolve(currentChannel);
    });
  });

/**
 * Get the current channel
 */
/* istanbul ignore next */
export const getCurrentChannelFromBackground = () =>
  sendMessageFromPageToBackground({
    type: "getCurrentChannel",
    data: {},
  });

/**
 * Request redirection to a store.
 *
 * @param slug Store slug.
 * @param mustSwitchTabs Boolean that indicates if the tab must be switched or not.
 */
/* istanbul ignore next */
export const redirectToStore = (slug: string, mustSwitchTabs = false) => {
  Promise.all([isUserLogged(), getCurrentChannel()]).then(
    ([userLogged, channel]) => {
      const path = `/redirect/${slug}/?channel=${channel}`;

      if (!userLogged) {
        redirectToLogin({ path, mustSwitchTabs });
      } else {
        sendMessageFromPageToBackground({
          type: "redirectToSiteFromBackground",
          data: { path, mustSwitchTabs },
        });
      }
    }
  );
};

/**
 * Request redirection to a store.
 *
 * Will show a warning about the cashback being disabled if the user is not logged.
 *
 * @param slug Offer slug.
 * @param store Store slug.
 * @param displayType Prop that indicates the kind of coupon. Can be "offer_online", "coupon_online" or "coupon_offline"
 * @param mustSwitchTabs Boolean that indicates if the tab must be switched or not.
 */
/* istanbul ignore next */
export const redirectToCoupon = (
  slug: string,
  store: string,
  mustSwitchTabs = true,
  hideCodeOnLoad = false
) => {
  Promise.all([isUserLogged(), getCurrentChannel()]).then(
    ([userLogged, channel]) => {
      let path = `/redirect/${store}/?offer=${slug}&channel=${channel}`;

      if (hideCodeOnLoad) {
        path = `/cupom-desconto/${store}/?offerPick=${slug}&channel=${channel}`;
      }

      if (!userLogged) {
        redirectToLogin({ path, mustSwitchTabs });
      } else {
        sendMessageFromPageToBackground({
          type: "redirectToSiteFromBackground",
          data: { path, mustSwitchTabs },
        });
      }
    }
  );
};

/**
 * Gets the user balance.
 */
export const getUserBalance = () =>
  new Promise<string>((resolve, reject) => {
    getFromStorage("clientToken").then(({ clientToken }) => {
      if (!clientToken) {
        log("[User] User not logged, Unable to get balance.");
        resolve("0,00");
        return;
      }

      new Request({
        path: `/loyalty/cuponeria/account/summary`,
        version: "4.0",
      })
        .get()
        .then((balance) => {
          const { data } = balance as unknown as {
            data: { balance: number };
          };
          const formattedBalance = convertNumberToCurrency(
            data?.balance || 0,
            "WITHOUT_SIGN"
          );
          resolve(formattedBalance);
        })
        .catch(reject);
    });
  });

/**
 * Performs tab openings.
 *
 * @param data A object containing path and a flag to show the cashback warning.
 * @param tabId Chrome's tab id
 */
/* istanbul ignore next */
export const redirectToSiteFromBackground = (
  data: { path: string; mustSwitchTabs: boolean },
  tabId: number
) =>
  new Promise(() => {
    const host = `${
      process.env.REACT_APP_ENV_TYPE === "development" ? "web" : "www"
    }.${process.env.REACT_APP_HOSTNAME}`;
    const url = `https://${host}.com.br${data.path}`;

    // open new tab
    chrome.tabs
      .create({
        url,
      })
      .then((tab) => {
        if (!data.mustSwitchTabs) return;

        log(`[User] Opening tab: ${url}`);

        const dataToBeStored: { [key: string]: string } = {};
        dataToBeStored[`mustShowActivatedCashbackTab_${tab?.id}`] = "true";
        setToStorage(dataToBeStored);

        try {
          // close actual window
          sendMessageFromBackgroundToContentScript(tabId, {
            type: "close",
          });
          // open saying that it was activated
          setTimeout(() => {
            sendMessageFromBackgroundToContentScript(tabId, {
              type: "navigateTo",
              data: `/cashback/status/notActivated?activatedTab=${tab.id}`,
            });
          }, 500);
        } catch (e: unknown) {
          // a tab antiga foi fechada pelo usuário
          log("failed to switch tab", e);
        }
      });
  });

/**
 * Performs window openings.
 *
 * @param data A object containing a path.
 */
/* istanbul ignore next */
export const openWindowFromBackground = (data: {
  path: string;
  executeAfter?: { path: string; mustSwitchTabs: boolean };
}) =>
  new Promise(() => {
    const host = `${
      process.env.REACT_APP_ENV_TYPE === "development" ? "web" : "www"
    }.${process.env.REACT_APP_HOSTNAME}`;
    const url = `https://${host}.com.br${data.path}`;

    // open new tab
    chrome.windows
      .getCurrent()
      .then((window) =>
        chrome.windows.create({
          url,
          width: 360,
          height: 540,
          type: "popup",
          left: (window.left || 0) + 360 / 2,
          top: (window.top || 0) + 400 / 2,
        })
      )
      .then((window) => {
        log(`[User] Opening window: ${url}`);
        setToStorage({
          windowRunningLogin: `${window.id}`,
          executeAfter: JSON.stringify(data.executeAfter || undefined),
        });
      });
  });

/**
 * @deprecated Opens a tab and redirect to Cuponeria wallet.
 *
 * @todo Should be moved to `redirectToSiteFromBackground`.
 */
/* istanbul ignore next */
export const openWalletFromBackground = () =>
  new Promise(() => {
    const host = `${
      process.env.REACT_APP_ENV_TYPE === "development" ? "web" : "www"
    }.${process.env.REACT_APP_HOSTNAME}`;
    const url = `https://${host}.com.br/conta/extrato`;
    chrome.tabs
      .create({
        url,
      })
      .then(() => {
        log(`[User] Opening tab: ${url}`);
      });
  });

/**
 * Generates a simple UUID v4.
 *
 * Code taken from https://stackoverflow.com/a/44078785
 *
 */
/* istanbul ignore next */
const generateSimpleUUID = () => {
  const u =
    Date.now().toString(16) + Math.random().toString(16) + "0".repeat(16);
  const guid = [
    u.substr(0, 8),
    u.substr(8, 4),
    `4000-8${u.substr(13, 3)}`,
    u.substr(16, 12),
  ].join("-");

  return guid;
};

/* istanbul ignore next */
export const getUserUUID = () =>
  new Promise<string>((resolve) => {
    getFromStorage("uuid").then(({ uuid }) => {
      if (!uuid) {
        // user don't have a UUID
        const newUUID = generateSimpleUUID();
        setToStorage({
          uuid: generateSimpleUUID(),
        });
        resolve(newUUID);
      } else {
        resolve(uuid);
      }
    });
  });

/* eslint-disable no-underscore-dangle */
import {
  getFromCookies,
  getFromStorage,
  removeCookie,
  removeFromStorage,
  setCookie,
  setToStorage,
} from "../chrome/storage";
import getEndpoint from "../utils/getEndpoint";
import AnalyticsService from "./analyticsService";
import { log } from "./logService";
import { RequestService as Request } from "./requestService";

/**
 * Removes the CLIENT_TOKEN cookie from the API domain.
 */
export const removeClientTokenCookie = () => {
  const endpoint = getEndpoint();
  const cookieUrl = `https://api.${endpoint}`;

  removeCookie(cookieUrl, "CLIENT_TOKEN");
};

/**
 * logs user out on backend.
 */
/* istanbul ignore next */
export const revokeCredentials = () =>
  new Promise<void>((resolve) => {
    new Request({
      path: `/loyalty/cuponeria/logout`,
      version: "4.0",
    })
      .get()
      .then(() => {
        log("[Auth] Credentials revoked.");
        resolve();
      })
      .catch(() => log("[Auth] Failed to revoke credentials."));
  });

/**
 * Clears all auth identifications.
 */
/* istanbul ignore next */
export const logoutUser = () => {
  revokeCredentials();
  removeFromStorage(["clientToken", "loginOrigin", "sessionToken"]);
  removeClientTokenCookie();
  log("[Auth] User was logged out.");
};

/**
 * Sets the CLIENT_TOKEN cookie so that fetch calls
 * with { credentials: 'include' } will include it automatically.
 *
 * @param token: user identification token
 */
export const setClientTokenCookie = (token: string) => {
  const endpoint = getEndpoint();
  const cookieUrl = `https://api.${endpoint}`;

  setCookie(cookieUrl, "CLIENT_TOKEN", token, "/");
};

/**
 * Authenticates using Cuponeria's cookies.
 *
 * @returns The current session token.
 */
/* istanbul ignore next */
export const authenticateUser = () =>
  new Promise((resolve, reject) => {
    let host = `https://www.${process.env.REACT_APP_HOSTNAME}.com.br`;

    if (process.env.REACT_APP_ENV_TYPE === "development") {
      host = `https://web.${process.env.REACT_APP_HOSTNAME}.com.br`;
    }

    getFromCookies({
      url: host,
      name: "CLIENT_TOKEN",
    })
      .then((cookie) => {
        const clientToken = cookie?.value;

        if (!clientToken) {
          logoutUser();
          resolve(false);
          return;
        }

        AnalyticsService.sendEvent("login", { method: "cuponeria" }, true);

        setToStorage({ clientToken, loginOrigin: "cuponeria" });
        setClientTokenCookie(clientToken);
        resolve(true);
      })
      .catch(() => {
        reject(Error("Failed to get authentication cookies"));
      });
  });

/**
 * Returns if the user is logged or not.
 */
/* istanbul ignore next */
export const isUserLogged = () =>
  getFromStorage("clientToken").then(
    ({ clientToken }) =>
      new Promise<boolean>((resolve) => {
        resolve(!!clientToken);
      })
  );

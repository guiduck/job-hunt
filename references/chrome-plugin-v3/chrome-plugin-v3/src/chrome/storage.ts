/* istanbul ignore file */

import { error, log } from "../services/logService";

interface IStorage {
  [key: string]: string | undefined;
}

/**
 * Remove data for Chrome1s storage.
 * @param key Key name.
 */
export const removeFromStorage = (key: string | string[]) => {
  if (typeof chrome !== "undefined") chrome.storage.local.remove(key);
};

/**
 * Get data from Chrome's storage.
 * @param key Key name.
 * @param checkExpiration Check if data has expired.
 */
export const getFromStorage = (
  key: string | string[] | undefined,
  checkExpiration?: boolean
): Promise<IStorage> => {
  if (typeof chrome !== "undefined") {
    return chrome.storage.local.get(key).then((result) => {
      if (checkExpiration) {
        const currentTime = new Date().getTime();
        chrome.storage.local
          .get("_expirationTimestamp")
          .then(({ _expirationTimestamp }) => {
            if (
              _expirationTimestamp !== undefined &&
              currentTime > _expirationTimestamp
            ) {
              // Data has expired, remove it from storage
              removeFromStorage([key as string, "_expirationTimestamp"]);
            }
          });
      }
      return result;
    });
  }

  // ... Mocking code for when chrome is not available
  const mockObject: IStorage = {};

  if (process.env.REACT_APP_CLIENT_TOKEN) {
    mockObject.clientToken = process.env.REACT_APP_CLIENT_TOKEN || "";
  }

  return Promise.resolve(mockObject);
};

/**
 * Set data to Chrome's storage.
 * @param data Tada to be saved.
 * @param expirationInterval time to expire in the storage.
 */
export const setToStorage = (data: IStorage, expirationInterval?: number) => {
  if (typeof chrome !== "undefined") {
    if (expirationInterval !== undefined) {
      const expirationTimestamp = new Date().getTime() + expirationInterval;
      const dataWithTimestamp = {
        ...data,
        _expirationTimestamp: expirationTimestamp,
      };
      chrome.storage.local.set(dataWithTimestamp);
    } else {
      chrome.storage.local.set(data);
    }
  }
};

/**
 * Get data from cookies.
 * @param data Name and url to search for cookies.
 */
export const getFromCookies = (data: { name: string; url: string }) =>
  new Promise<Partial<chrome.cookies.Cookie>>((resolve) => {
    if (typeof chrome === "undefined") {
      resolve({ value: "" });
      return;
    }

    chrome.cookies.get(data, (cookie) => {
      if (!cookie) {
        resolve({ value: "" });
        return;
      }

      resolve(cookie);
    });
  });

/**
 * Generic function to set a cookie using Chrome's cookies API.
 * By default, `path = "/"`.
 * @param url Cookie url.
 * @param name Cookie name.
 * @param value Cookie value.
 * @param path Cookie path.
 */
export const setCookie = (
  url: string,
  name: string,
  value: string,
  path = "/"
) => {
  if (typeof chrome === "undefined") return;

  chrome.cookies.set({ url, name, value, path }, (cookie) => {
    if (chrome.runtime.lastError) {
      error("Failed to set cookie:", chrome.runtime.lastError);
    }

    log(`Cookie [${name}] set:`, cookie);
  });
};

/**
 * Removes a cookie with Chrome's cookies API.
 * @param url Cookie url.
 * @param name Cookie name.
 */
export const removeCookie = (url: string, name: string) => {
  if (typeof chrome === "undefined") return;

  chrome.cookies.remove({ url, name }, (details) => {
    log(`Cookie [${name}] removed:`, details);
  });
};

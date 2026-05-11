import { log } from "../services/logService";
import { Domain } from "../services/storeService";
import levenshtein from "./levenshtein";

// Function to find the best matching store based on Levenshtein distance
export const findBestMatchingStore = (
  hostAsUrl: string,
  listOfStores: Domain[]
): Domain | undefined => {
  let selectedStore: Domain | undefined;
  let levenDistance = Number.MAX_VALUE;

  listOfStores.forEach((store) => {
    try {
      const hostToTest = new URL(store.storeUrl).hostname.replace(
        /www\.|\.com\.br|\.com/gi,
        ""
      );

      const currentDistance = levenshtein(hostAsUrl, hostToTest);

      if (currentDistance < levenDistance) {
        // if any of the words in the host are the same as the store url, select it
        if (hostAsUrl.includes(hostToTest) || hostToTest.includes(hostAsUrl)) {
          const splitHost = hostAsUrl.split(".");
          const splitHostToTest = hostToTest.split(".");

          splitHostToTest.forEach((splitTestString) => {
            splitHost.forEach((splitString) => {
              if (splitString === splitTestString) {
                levenDistance = currentDistance;
                selectedStore = store;
              }
            });
          });
        }
      }
    } catch (e) {
      // Log invalid store URLs
      log("[Store] Invalid store url", { store });
    }
  });

  return selectedStore;
};

export default findBestMatchingStore;

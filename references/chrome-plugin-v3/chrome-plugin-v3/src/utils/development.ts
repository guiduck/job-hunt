/* eslint-disable no-console */
/* istanbul ignore file */

import { log } from "../services/logService";

const setupDevelopmentStuff = () => {
  if (process.env.REACT_APP_ENV_TYPE !== "development") {
    return;
  }

  log(`[APP] Extension running in "${process.env.REACT_APP_ENV_TYPE}"`);

  const reload = () => {
    chrome.runtime.reload();
  };

  setInterval(async () => {
    fetch("http://127.0.0.1:7890")
      .then((res) => res?.text())
      .then((e) => {
        chrome.storage.local.get("hashBuild", (result) => {
          if (result.hashBuild !== e) {
            log(`[APP] Changes detected. Extension reloading.`);
            reload();
            chrome.storage.local.set({ hashBuild: e.trim() });
          }
        });
      })
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .catch(() => {});
  }, 1000);
};

export default setupDevelopmentStuff;

/* istanbul ignore file */

export interface Message<T> {
  type: string;
  data?: T;
}

export interface MessageListener {
  [key: string]: (data: {
    tabId: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
  }) => Promise<unknown> | void;
}

export const sendMessageFromBackgroundToContentScript = <T>(
  tabId: number,
  payload: Message<T>
) => {
  chrome.tabs.sendMessage(tabId, payload);
};

export const sendMessageFromPageToBackground = <T>(payload: Message<T>) => {
  return new Promise<unknown>((resolve) => {
    if (typeof chrome === "undefined") {
      resolve("");
      return;
    }
    chrome.runtime.sendMessage(payload, resolve);
  });
};

export const enableBackgroundMessageListener = (typesMap: MessageListener) => {
  if (typeof chrome === "undefined") return;

  chrome.runtime.onMessage.addListener((msg, port, response) => {
    Promise.resolve(
      typesMap[msg.type]({ tabId: port.tab?.id || 0, data: msg.data })
    ).then(response);
    return true;
  });
};

/* istanbul ignore file */

/**
 * This is a wrapper for a external service. There's no need for tests.
 */

import { sendMessageFromPageToBackground } from "../chrome/messaging";
import { getUserUUID } from "./userService";

interface AnalyticsParams {
  measurementId: string; // GA Admin > Data Streams > choose your stream > Measurement ID
  apiSecret: string; // GA > Admin > Data Streams > choose your stream > Measurement Protocol > Create
}

type EventParamType = {
  [key: string]: string | number;
};

export interface AnalyticsPayload {
  name: string | number;
  params: {
    [key: string]: string | number;
  };
}

/**
 * Wrapper for Google Analytics.
 */
export default class AnalyticsService {
  private static defaultParams: AnalyticsParams;

  private static analyticsID = "G-1S49FXPW6R";

  private static apiSecret = "J8guK8sLRB2NGZSY7OQozw";

  private static analyticsEndpoint =
    "https://www.google-analytics.com/mp/collect";

  private static analyticsDebugEndpoint =
    "https://www.google-analytics.com/debug/mp/collect";

  /**
   * Set AnalyticsId based on user's channel
   */
  private static setAnalyticsID = async (): Promise<void> => {
    this.analyticsID = "G-1S49FXPW6R";
  };

  /**
   * Build the Google Analytics default params.
   */
  public static buildClient = () => {
    if (!this.defaultParams) {
      this.setAnalyticsID();
      this.defaultParams = {
        apiSecret: this.apiSecret,
        measurementId: this.analyticsID,
      };
    }

    return this.defaultParams;
  };

  /**
   * Send a event to Google Analytics.
   *
   * @param action The action name used as the event name
   * @param eventParam The event params object
   * @param sendDirect Fire the event request directly
   */
  static sendEvent = (
    action: string,
    eventParam: EventParamType,
    sendDirect = false
  ) => {
    const payload = {
      name: encodeURIComponent(action),
      params: {
        ...eventParam,
      },
    };

    const defaultParams = this.buildClient();

    if (sendDirect) {
      return this.sendAnalyticsRequest(defaultParams, payload);
    }

    return this.fireBackgroundRequest(defaultParams, payload);
  };

  /**
   * Send analytics data to background script.
   *
   * @param params Analytics params
   * @param payload Analytics payload
   * @returns Promise
   */
  private static fireBackgroundRequest = (
    params: AnalyticsParams,
    payload: AnalyticsPayload
  ) => {
    return sendMessageFromPageToBackground<{
      params: AnalyticsParams;
      payload: AnalyticsPayload;
    }>({
      type: "sendAnalyticsRequest",
      data: { params, payload },
    });
  };

  /**
   * Send a request to Google Analytics servers.
   *
   * MUST be called only from background script.
   *
   * @param params Analytics prams
   * @param payload Analytics payload
   * @returns Promise
   */
  static sendAnalyticsRequest = (
    params: AnalyticsParams,
    payload: AnalyticsPayload
  ) =>
    new Promise((resolve, reject) => {
      let url = `${this.analyticsEndpoint}?measurement_id=${params.measurementId}&api_secret=${params.apiSecret}`;

      if (process.env.REACT_APP_ENV_TYPE !== "production") {
        url = `${this.analyticsDebugEndpoint}?measurement_id=${params.measurementId}&api_secret=${params.apiSecret}`;
      }

      getUserUUID()
        .then((cid) =>
          fetch(url, {
            method: "POST",
            body: JSON.stringify({
              client_id: cid,
              events: [{ ...payload }],
            }),
          })
        )
        .then((response) => {
          resolve(response.status === 200);
        })
        .catch(reject);
    });
}

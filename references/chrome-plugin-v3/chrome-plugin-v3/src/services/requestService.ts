// TODO: Tirar o serviço de dentro da classe
import { getFromStorage, setToStorage } from "../chrome/storage";
import { logoutUser } from "./authenticationService";
import { log } from "./logService";

export interface RequestProps {
  path: string;
  params?: { [key: string]: string };
  body?: { [key: string]: string | undefined };
  headers?: { [key: string]: string };
  version: string;
  cacheKey?: string;
  cacheTime?: number;
}

export interface Response<T = unknown> {
  /* retcode is @deprecated */
  retcode?: string | number;
  data?: T;
  msg?: string;
}

/**
 * Class that handles all requests to API.
 *
 * @param props Request properties.
 */
export class RequestService {
  private props: RequestProps;

  constructor(props: RequestProps) {
    this.props = props;
  }

  /**
   * Select the endpoint based off in the environment.
   *
   * @returns {string} A string containing the endpoint url.
   */
  private static getEndpoint = (): string => {
    /* istanbul ignore next */
    switch (process.env.REACT_APP_ENV_TYPE) {
      case "development":
      case "homolog":
        return "kuponeria.com.br";

      case "production":
      default:
        return "cuponeria.com.br";
    }
  };

  /**
   * Builds a proper url to be requested.
   *
   * @returns {string} A formatted url.
   */
  private buildUrl = (): string => {
    const endpoint = RequestService.getEndpoint();
    const { path, params, version } = this.props;
    const query = new URLSearchParams(params);
    return `https://api.${endpoint}/public/v${version}${path}?${query}`;
  };

  /* istanbul ignore next */
  /**
   * Get cached data.
   *
   * @param key Cache key
   * @returns {Response} A cached respose object
   */
  private static getCachedData = (
    key?: string
  ): Promise<Response | undefined> =>
    new Promise((resolve) => {
      if (!key || process.env.REACT_APP_ENV_TYPE === "test") {
        resolve(undefined);
        return;
      }

      getFromStorage(key).then((response) => {
        const cachePayload = response[key];

        if (!cachePayload) {
          resolve(undefined);
          return;
        }

        const payloadJson: { data: string; ttl: number } =
          JSON.parse(cachePayload);

        if (payloadJson.ttl < Date.now()) {
          resolve(undefined);
          return;
        }

        log(`[Cache] Getting ${key}`, { expires: payloadJson.ttl });

        resolve(JSON.parse(payloadJson.data));
      });
    });

  /* istanbul ignore next */
  /**
   * Caches data.
   *
   * @param key Cache key
   * @param data String to be cached
   * @param expiresInMs Expiration time in milliseconds
   * @returns
   */
  private static saveCachedData = (
    key?: string,
    data?: string,
    expiresInMs = 0
  ) => {
    if (!key || process.env.REACT_APP_ENV_TYPE === "test") {
      return;
    }

    const ttl = Date.now() + expiresInMs;

    const payload = {
      data,
      ttl,
    };

    const toStorage: { [key: string]: string } = {};

    toStorage[key] = JSON.stringify(payload);

    log(`[Cache] Storing ${key}`, { expires: ttl });

    setToStorage(toStorage);
  };

  /**
   * Performs a GET request.
   *
   * @returns {Response} The response data.
   */
  get = (): Promise<Response> =>
    new Promise((resolve, reject) => {
      const url = this.buildUrl();

      RequestService.getCachedData(this.props.cacheKey).then((cache) => {
        /* istanbul ignore if */
        if (cache) {
          resolve(cache);
          return;
        }

        fetch(url, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.message === "client token inválido") {
              logoutUser();
            }

            const payload = {
              retcode: data.retcode,
              data: data.data,
              msg: data.msg || data.message,
            };

            RequestService.saveCachedData(
              this.props.cacheKey,
              JSON.stringify(payload),
              this.props.cacheTime
            );

            resolve(payload);
          })
          .catch(reject);
      });
    });

  /**
   * Performs a POST request.
   *
   * @returns {Response} The response data.
   */
  post = (): Promise<Response> =>
    new Promise((resolve, reject) => {
      const url = this.buildUrl();
      const { body } = this.props;

      fetch(url, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify(body),
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message === "clientToken inválido") {
            logoutUser();
          }
          const payload = {
            retcode: data.retcode,
            data: data.data,
            msg: data.msg || data.message,
          };

          return payload;
        })
        .then(resolve)
        .catch(reject);
    });
}

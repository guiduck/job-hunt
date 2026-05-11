/* eslint-disable no-console */

/**
 * Either logs a message if in development or do nothing
 *
 * @param title Log message title.
 * @param message Log message string.
 *
 */
export const log = (title: string, message?: unknown) => {
  if (process.env.REACT_APP_ENV_TYPE !== "development") {
    return;
  }

  console.log(title, message || "");
};

/**
 * Either send error to the server or logs message if in development
 *
 * @param title Log message title.
 * @param message Log message string.
 *
 */
export const error = (title: string, message?: unknown) =>
  console.error(title, message || "");

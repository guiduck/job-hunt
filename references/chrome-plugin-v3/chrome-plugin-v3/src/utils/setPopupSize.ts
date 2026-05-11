import { sendMessageFromPageToBackground } from "../chrome/messaging";

/* istanbul ignore next */
export const setPopupSize = (
  width: string,
  height: string,
  clipPath: string
) => {
  sendMessageFromPageToBackground<{
    width: string;
    height: string;
    clipPath: string;
  }>({
    type: "resize",
    data: {
      width,
      height,
      clipPath,
    },
  });
};

export default setPopupSize;

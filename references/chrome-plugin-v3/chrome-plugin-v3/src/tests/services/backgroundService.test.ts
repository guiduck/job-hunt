/* eslint-disable @typescript-eslint/no-explicit-any */
import * as BackgroundService from "../../services/backgroundService";

describe("[Background Service]", () => {
  test("Check if messages types are being set", () => {
    const types = BackgroundService.getMessagesTypes;
    expect(types).toBeTruthy();
  });
});

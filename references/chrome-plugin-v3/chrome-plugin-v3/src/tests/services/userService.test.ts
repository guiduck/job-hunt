/* eslint-disable @typescript-eslint/no-explicit-any */
import * as UserService from "../../services/userService";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line no-underscore-dangle
window._origin = "https://www.cuponeria.com.br";

jest.setTimeout(60000);

describe("[User Service]", () => {
  test("Get user balance", (done) => {
    UserService.getUserBalance()
      .then((balance) => {
        expect(balance).toBeTruthy();
      })
      .catch(done)
      .finally(done);
  });
});

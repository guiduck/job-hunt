/* eslint-disable @typescript-eslint/no-explicit-any */
import * as SearchService from "../../services/searchService";

jest.setTimeout(60000);

describe("[Search Service]", () => {
  test("Check if search results is being returned", async () => {
    const result = await SearchService.searchByTermFromBackground({
      term: "americanas",
    });

    expect(result).toBeTruthy();
    expect(result.offers.length).toBeGreaterThan(0);
    expect(result.stores.length).toBeGreaterThan(0);
  });

  test("Check if search returns no results if term is empty", async () => {
    const result = await SearchService.searchByTermFromBackground({
      term: "",
    });

    expect(result).toBeTruthy();
    expect(result.offers.length).toBe(0);
    expect(result.stores.length).toBe(0);
  });

  test("Check if there is suggested offers", async () => {
    const result = await SearchService.getSuggestedOffersFromBackground();

    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
  });
});

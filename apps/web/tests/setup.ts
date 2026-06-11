import "@testing-library/jest-dom/vitest";

declare global {
  // eslint-disable-next-line no-var
  var nicheCatalogTestHelpers:
    | {
        cleanup: () => Promise<void>;
      }
    | undefined;
}

globalThis.nicheCatalogTestHelpers = {
  async cleanup() {
    return Promise.resolve();
  }
};

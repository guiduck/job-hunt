import { describe, expect, it } from "vitest";

function replaceLatest(existing: string | null, next: string) {
  return next || existing;
}

describe("latest generated text integration", () => {
  it("keeps a single latest text value for a generation slot", () => {
    const first = replaceLatest(null, "Prompt v1");
    const second = replaceLatest(first, "Prompt v2");
    expect(second).toBe("Prompt v2");
  });
});

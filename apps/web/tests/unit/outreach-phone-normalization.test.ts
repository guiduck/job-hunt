import { describe, expect, it } from "vitest";
import { normalizeOutreachPhone } from "@/lib/freelance/bulk-outreach-service";

describe("outreach phone normalization", () => {
  it("adds Brazil's mandatory ninth digit to legacy mobile numbers", () => {
    expect(normalizeOutreachPhone("+55 61 8272-4656")).toBe("+5561982724656");
    expect(normalizeOutreachPhone("61 8272-4656", "Brasil")).toBe("+5561982724656");
  });

  it("keeps Brazilian landlines and modern mobile numbers unchanged", () => {
    expect(normalizeOutreachPhone("+55 61 3060-0506")).toBe("+556130600506");
    expect(normalizeOutreachPhone("+55 61 99819-8403")).toBe("+5561998198403");
  });
});

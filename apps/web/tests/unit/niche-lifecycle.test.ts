import { describe, expect, it } from "vitest";
import {
  assertLifecycleUpdate,
  assertSourceEvidence,
  NicheServiceError
} from "@/lib/freelance/niche-service";

describe("niche lifecycle rules", () => {
  it("allows enable and disable state changes with valid evidence", () => {
    expect(() =>
      assertSourceEvidence({
        enabled: true,
        lifecycleStatus: "approved",
        queryTerms: ["dentist"],
        sourcePath: "docs/reference-ui.md",
        sourceNote: "Operator approved",
        conversionHint: 12,
        conversionHintSource: "operator_override"
      })
    ).not.toThrow();

    expect(() =>
      assertSourceEvidence({
        enabled: false,
        lifecycleStatus: "disabled",
        queryTerms: [],
        sourcePath: null,
        sourceNote: null
      })
    ).not.toThrow();
  });

  it("requires source evidence for enabled approved niches", () => {
    expect(() =>
      assertSourceEvidence({
        enabled: true,
        lifecycleStatus: "approved",
        queryTerms: ["solar installer"],
        sourcePath: "",
        sourceNote: "",
        conversionHint: 9,
        conversionHintSource: "operator_override"
      })
    ).toThrow(NicheServiceError);
  });

  it("rejects self-merge validation", () => {
    expect(() =>
      assertLifecycleUpdate({
        id: "niche-1",
        lifecycleStatus: "merged",
        mergedIntoNicheId: "niche-1"
      })
    ).toThrow("A niche cannot be merged into itself.");
  });
});

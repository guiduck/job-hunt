import { beforeEach, describe, expect, it, vi } from "vitest";

const findUniqueMock = vi.fn();
const updateMock = vi.fn();
const createNicheMock = vi.fn();

vi.mock("@/lib/freelance/repositories", () => ({
  freelanceRepositories: {
    nicheCandidates: {
      findUnique: findUniqueMock,
      update: updateMock
    }
  }
}));

vi.mock("@/lib/freelance/niche-service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/freelance/niche-service")>(
    "@/lib/freelance/niche-service"
  );
  return {
    ...actual,
    createNiche: createNicheMock
  };
});

const { decideNicheCandidate } = await import("@/lib/freelance/niche-candidate-service");

describe("niche candidate approval", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    updateMock.mockReset();
    createNicheMock.mockReset();
  });

  it("approves a candidate by creating an approved catalog niche through niche validation", async () => {
    findUniqueMock.mockResolvedValue({
      id: "candidate-1",
      proposedName: "Solar Installer",
      proposedSlug: "solar-installer",
      marketApplicability: "INTERNATIONAL",
      proposedConversionHint: { toString: () => "13.2" },
      proposedQueryTerms: ["Solar installer"],
      sourcePath: "docs/reference-ui.md#visual-reference",
      sourceNote: "Visual reference",
      sourceExcerpt: "Solar installer category",
      status: "proposed"
    });
    createNicheMock.mockResolvedValue({ id: "niche-new", displayName: "Solar Installer" });
    updateMock.mockResolvedValue({
      id: "candidate-1",
      proposedName: "Solar Installer",
      normalizedName: "Solar Installer",
      proposedSlug: "solar-installer",
      marketApplicability: "INTERNATIONAL",
      proposedConversionHint: { toString: () => "13.2" },
      proposedQueryTerms: ["Solar installer"],
      sourcePath: "docs/reference-ui.md#visual-reference",
      sourceNote: "Visual reference",
      sourceExcerpt: "Solar installer category",
      status: "approved",
      matchedNicheId: "niche-new",
      decisionReason: "Approved into governed catalog.",
      reviewedAt: new Date("2026-01-01T00:00:00.000Z"),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      matchedNiche: { displayName: "Solar Installer", name: "Solar Installer" }
    });

    const result = await decideNicheCandidate("candidate-1", { decision: "approve" });

    expect(createNicheMock).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: "Solar Installer",
        sourcePath: "docs/reference-ui.md#visual-reference",
        queryTerms: ["Solar installer"],
        conversionHintSource: "visual_reference"
      })
    );
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "candidate-1" },
        data: expect.objectContaining({ status: "approved", matchedNicheId: "niche-new" })
      })
    );
    expect(result).toMatchObject({ status: "approved" });
  });
});

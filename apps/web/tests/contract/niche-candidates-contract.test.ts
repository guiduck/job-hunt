import { beforeEach, describe, expect, it, vi } from "vitest";

const listNicheCandidatesMock = vi.fn();
const decideNicheCandidateMock = vi.fn();

vi.mock("@/lib/freelance/niche-candidate-service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/freelance/niche-candidate-service")>(
    "@/lib/freelance/niche-candidate-service"
  );
  return {
    ...actual,
    listNicheCandidates: listNicheCandidatesMock,
    decideNicheCandidate: decideNicheCandidateMock
  };
});

const { GET } = await import("@/app/api/freelance/niche-candidates/route");
const { PATCH } = await import("@/app/api/freelance/niche-candidates/[candidateId]/route");
const { NicheCandidateServiceError } = await import("@/lib/freelance/niche-candidate-service");

describe("niche candidate API contract", () => {
  beforeEach(() => {
    listNicheCandidatesMock.mockReset();
    decideNicheCandidateMock.mockReset();
  });

  it("lists niche-only candidates with optional filters", async () => {
    listNicheCandidatesMock.mockResolvedValue([
      {
        id: "candidate-1",
        proposedName: "Imobiliaria",
        proposedSlug: "imobiliaria",
        status: "proposed",
        sourcePath: "docs/reference-ui.md#visual-reference"
      }
    ]);

    const response = await GET(
      new Request("http://localhost/api/freelance/niche-candidates?status=proposed&market=BR")
    );

    expect(response.status).toBe(200);
    expect(listNicheCandidatesMock).toHaveBeenCalledWith({ status: "proposed", market: "BR" });
    expect(await response.json()).toMatchObject({
      items: [{ id: "candidate-1", proposedName: "Imobiliaria" }]
    });
  });

  it("applies candidate decisions through the detail route", async () => {
    decideNicheCandidateMock.mockResolvedValue({
      id: "candidate-1",
      status: "already_covered",
      matchedNicheId: "niche-1"
    });

    const response = await PATCH(
      new Request("http://localhost/api/freelance/niche-candidates/candidate-1", {
        method: "PATCH",
        body: JSON.stringify({ decision: "mark_already_covered", matchedNicheId: "niche-1" })
      }),
      { params: Promise.resolve({ candidateId: "candidate-1" }) }
    );

    expect(response.status).toBe(200);
    expect(decideNicheCandidateMock).toHaveBeenCalledWith("candidate-1", {
      decision: "mark_already_covered",
      matchedNicheId: "niche-1"
    });
    expect(await response.json()).toMatchObject({ status: "already_covered" });
  });

  it("returns service errors without exposing internal details", async () => {
    decideNicheCandidateMock.mockRejectedValue(
      new NicheCandidateServiceError("Candidate not found.", 404)
    );

    const response = await PATCH(
      new Request("http://localhost/api/freelance/niche-candidates/missing", {
        method: "PATCH",
        body: JSON.stringify({ decision: "approve" })
      }),
      { params: Promise.resolve({ candidateId: "missing" }) }
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Candidate not found." });
  });
});

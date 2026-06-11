import { describe, expect, it } from "vitest";
import { buildNicheAuditReport } from "@/lib/freelance/niche-audit-service";
import { catalogRowsFromBaseline } from "../fixtures/niche-catalog";
import { visualCandidateFixtures } from "../fixtures/niche-candidates";
import { expectAuditShape } from "../helpers/niche-audit-assertions";

describe("GET /api/freelance/niche-audit contract", () => {
  it("returns run metadata, summary, severity groups, and findings", () => {
    const report = buildNicheAuditReport({
      rows: catalogRowsFromBaseline(),
      candidates: visualCandidateFixtures,
      runId: "contract-run"
    });

    expectAuditShape(report);
    expect(report.runId).toBe("contract-run");
    expect(Object.keys(report.groupedFindings)).toEqual(["blocking", "warning", "info"]);
  });
});


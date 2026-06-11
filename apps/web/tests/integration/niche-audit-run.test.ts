import { describe, expect, it } from "vitest";
import { buildNicheAuditReport } from "@/lib/freelance/niche-audit-service";
import { catalogRowsFromBaseline } from "../fixtures/niche-catalog";

describe("niche audit run persistence payload", () => {
  it("produces counts and findings suitable for persisted audit runs", () => {
    const report = buildNicheAuditReport({
      rows: catalogRowsFromBaseline(),
      runId: "persisted-run",
      createdAt: new Date("2026-06-09T00:00:00.000Z")
    });

    expect(report.runId).toBe("persisted-run");
    expect(report.createdAt).toBe("2026-06-09T00:00:00.000Z");
    expect(report.summary.conversionMismatchCount).toBe(1);
    expect(report.findings.length).toBeGreaterThan(0);
  });
});


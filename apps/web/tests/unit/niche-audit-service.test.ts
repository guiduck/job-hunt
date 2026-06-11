import { describe, expect, it } from "vitest";
import { BASELINE_NICHE_COUNT } from "@/lib/freelance/niche-reference-data";
import { buildNicheAuditReport } from "@/lib/freelance/niche-audit-service";
import { catalogRowsFromBaseline, findFixtureNiche } from "../fixtures/niche-catalog";
import { expectFinding } from "../helpers/niche-audit-assertions";

describe("niche audit service", () => {
  it("reports baseline counts from the approved catalog", () => {
    const report = buildNicheAuditReport({ rows: catalogRowsFromBaseline() });

    expect(report.summary.baselineCount).toBe(BASELINE_NICHE_COUNT);
    expect(report.summary.approvedCount).toBe(BASELINE_NICHE_COUNT);
  });

  it("reports missing, extra, source-missing, and duplicate findings", () => {
    const rows = catalogRowsFromBaseline();
    const removed = rows.shift();
    const duplicate = { ...findFixtureNiche(rows, "Dentista"), id: "duplicate-dentista" };
    const extra = {
      ...findFixtureNiche(rows, "Cleaning Service"),
      id: "extra-solar",
      name: "Solar Installer",
      displayName: "Solar Installer",
      slug: "solar-installer",
      sourcePath: null
    };

    const report = buildNicheAuditReport({ rows: [...rows, duplicate, extra] });

    expect(removed).toBeDefined();
    expectFinding(report, "missing");
    expectFinding(report, "extra");
    expectFinding(report, "source_missing");
    expectFinding(report, "duplicate");
  });
});

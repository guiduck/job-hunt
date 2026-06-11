import { describe, expect, it } from "vitest";
import { buildNicheAuditReport } from "@/lib/freelance/niche-audit-service";
import { catalogRowsFromBaseline, findFixtureNiche } from "../fixtures/niche-catalog";

describe("niche conversion conflicts", () => {
  it("blocks alignment while Imobiliaria has competing text and visual values", () => {
    const report = buildNicheAuditReport({ rows: catalogRowsFromBaseline() });
    const conflict = report.findings.find((finding) => finding.findingType === "conversion_hint_mismatch");

    expect(conflict).toMatchObject({
      severity: "blocking",
      referenceName: "Imobiliaria",
      expectedValue: "6.1",
      currentValue: "11"
    });
    expect(report.status).toBe("failed");
  });

  it("allows an operator override to resolve the Imobiliaria conflict", () => {
    const rows = catalogRowsFromBaseline();
    const imobiliaria = findFixtureNiche(rows, "Imobiliaria");
    imobiliaria.conversionHintSource = "operator_override";
    imobiliaria.conversionHint = 6.1;

    const report = buildNicheAuditReport({ rows });

    expect(report.findings.some((finding) => finding.findingType === "conversion_hint_mismatch")).toBe(false);
  });
});


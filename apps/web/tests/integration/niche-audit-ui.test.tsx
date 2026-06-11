import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConversionConflictPanel } from "@/components/niches/conversion-conflict-panel";
import { NicheAuditFindings } from "@/components/niches/niche-audit-findings";
import { NicheAuditSummary } from "@/components/niches/niche-audit-summary";
import { buildNicheAuditReport } from "@/lib/freelance/niche-audit-service";
import { catalogRowsFromBaseline } from "../fixtures/niche-catalog";
import { expectNoCsvControls } from "../helpers/no-csv-assertions";

describe("niche audit UI", () => {
  it("renders summary, finding groups, and conversion conflict values without CSV controls", () => {
    const report = buildNicheAuditReport({ rows: catalogRowsFromBaseline() });
    const { container } = render(
      <>
        <NicheAuditSummary report={report} />
        <ConversionConflictPanel report={report} />
        <NicheAuditFindings report={report} />
      </>
    );

    expect(screen.getByText("Catalog audit")).toBeInTheDocument();
    expect(screen.getByText("Imobiliaria conversion hint")).toBeInTheDocument();
    expect(screen.getByText("blocking")).toBeInTheDocument();
    expectNoCsvControls(container.textContent ?? "");
  });
});

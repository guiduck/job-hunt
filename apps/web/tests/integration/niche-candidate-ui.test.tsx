import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NicheCandidateList } from "@/components/niches/niche-candidate-list";
import type { NicheDto } from "@/lib/freelance/campaign-service";
import type { NicheCandidateDto } from "@/lib/freelance/niche-candidate-service";
import { expectNoCsvControls } from "../helpers/no-csv-assertions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

const candidate: NicheCandidateDto = {
  id: "candidate-1",
  proposedName: "Imobiliaria",
  normalizedName: "Imobiliaria",
  proposedSlug: "imobiliaria",
  marketApplicability: "BR",
  proposedConversionHint: 6.1,
  proposedQueryTerms: ["Imobiliaria"],
  sourcePath: "docs/reference-ui.md#visual-reference",
  sourceExcerpt: "visual reference",
  sourceNote: "Lower conversion estimate",
  status: "proposed",
  matchedNicheId: "niche-1",
  matchedNicheName: "Imobiliaria",
  decisionReason: null,
  reviewedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
};

const niche: NicheDto = {
  id: "niche-1",
  name: "Imobiliaria",
  displayName: "Imobiliaria",
  slug: "imobiliaria",
  market: "BR",
  marketApplicability: "BR",
  conversionHint: 11,
  conversionHintSource: "text_seed",
  aliases: [],
  queryTerms: ["Imobiliaria"],
  sourcePath: "apps/web/prisma/seed-data/niches.ts",
  sourceNote: "Baseline reference",
  lifecycleStatus: "approved",
  lastAuditedAt: null,
  enabled: true,
  sortOrder: 16
};

describe("niche candidate UI", () => {
  it("renders statuses, source evidence, and decision actions without CSV controls", () => {
    const { container } = render(<NicheCandidateList candidates={[candidate]} niches={[niche]} />);

    expect(screen.getAllByText("Imobiliaria").length).toBeGreaterThan(0);
    expect(screen.getByText("proposed")).toBeInTheDocument();
    expect(screen.getByText("docs/reference-ui.md#visual-reference")).toBeInTheDocument();
    expect(screen.getByText("Suggested match: Imobiliaria")).toBeInTheDocument();

    fireEvent.click(screen.getByTitle("Review candidate"));
    expect(screen.getByText("Approve into catalog")).toBeInTheDocument();
    expect(screen.getByText("Mark already covered")).toBeInTheDocument();
    expect(screen.getByLabelText("Decision reason")).toBeInTheDocument();
    expectNoCsvControls(container.textContent ?? "");
  });
});

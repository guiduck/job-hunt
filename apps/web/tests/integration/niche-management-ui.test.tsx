import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ApprovedNicheTable } from "@/components/niches/approved-niche-table";
import { NicheForm } from "@/components/niches/niche-form";
import type { NicheDto } from "@/lib/freelance/campaign-service";
import { expectNoCsvControls } from "../helpers/no-csv-assertions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

const niche: NicheDto = {
  id: "niche-1",
  name: "Dentist",
  displayName: "Dentist",
  slug: "dentist",
  market: "INTERNATIONAL",
  marketApplicability: "INTERNATIONAL",
  conversionHint: 17.5,
  conversionHintSource: "text_seed",
  aliases: ["Dental clinic"],
  queryTerms: ["dentist"],
  sourcePath: "docs/reference-ui.md",
  sourceNote: "Baseline reference",
  lifecycleStatus: "approved",
  lastAuditedAt: null,
  enabled: true,
  sortOrder: 1
};

describe("niche management UI", () => {
  it("shows form validation fields and slug preview", async () => {
    render(<NicheForm />);

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Solar Installer" }
    });

    expect(screen.getByText("Slug preview: solar-installer")).toBeInTheDocument();
    expect(screen.getByLabelText("Query terms")).toBeRequired();
    expect(screen.getByLabelText("Source path")).toBeRequired();
    expect(screen.getByLabelText("Source note")).toBeRequired();
  });

  it("renders edit, disable, re-enable, and merge actions without CSV controls", () => {
    const { container } = render(
      <ApprovedNicheTable
        niches={[
          niche,
          { ...niche, id: "niche-2", displayName: "Plumber", slug: "plumber", enabled: false, lifecycleStatus: "disabled" }
        ]}
      />
    );

    expect(screen.getAllByTitle("Edit niche")).toHaveLength(2);
    expect(screen.getByTitle("Disable niche")).toBeInTheDocument();
    expect(screen.getByTitle("Re-enable niche")).toBeInTheDocument();
    expect(screen.getByText("Merge duplicate niche")).toBeInTheDocument();
    expectNoCsvControls(container.textContent ?? "");
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PortfolioCatalog } from "@/components/portfolio/portfolio-catalog";

const entry = {
  nicheId: "niche-1",
  nicheName: "Dental clinic",
  nicheSlug: "dental-clinic",
  nicheEnabled: true,
  nicheLifecycleStatus: "approved",
  projectName: null,
  repositoryUrl: null,
  demoUrl: null,
  notes: null,
  updatedAt: null
};

describe("portfolio catalog UI", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists niches, filters them, and saves project links", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ item: { nicheId: "niche-1" } }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);
    render(
      <PortfolioCatalog
        entries={[
          entry,
          { ...entry, nicheId: "niche-2", nicheName: "Restaurant", nicheSlug: "restaurant" }
        ]}
      />
    );

    expect(screen.getByText("Dental clinic")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Buscar nicho no portfolio"), {
      target: { value: "dental" }
    });
    expect(screen.queryByText("Restaurant")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Demo publicada para Dental clinic"), {
      target: { value: "https://dental.example.com" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar projeto" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/freelance/portfolio/niche-1",
        expect.objectContaining({ method: "PUT" })
      )
    );
    expect(await screen.findByText("Projeto salvo.")).toBeInTheDocument();
  });
});

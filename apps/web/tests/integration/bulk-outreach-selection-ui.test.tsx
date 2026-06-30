import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LeadTable } from "@/components/leads/lead-table";
import { useFreelanceUiStore } from "@/lib/freelance/ui-store";

const leads = [
  {
    id: "lead_1",
    businessName: "Example Clinic",
    city: "Austin",
    phone: "+15555550123",
    whatsapp: "+15555550123",
    email: "owner@example.com",
    websiteUrl: "https://example.com",
    websiteStatus: "weak_site",
    leadScore: 82,
    temperature: "hot",
    commercialStatus: "new"
  },
  {
    id: "lead_2",
    businessName: "Second Studio",
    city: "Miami",
    phone: null,
    whatsapp: null,
    email: null,
    websiteUrl: null,
    websiteStatus: "no_site",
    leadScore: 66,
    temperature: "warm",
    commercialStatus: "new"
  }
];

describe("bulk outreach selection UI", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    useFreelanceUiStore.getState().clearLeadSelection();
  });

  it("selects individual and visible leads without hiding row navigation", () => {
    render(<LeadTable leads={leads} />);

    fireEvent.click(screen.getByLabelText("Select Example Clinic"));
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "View" })[0]).toHaveAttribute(
      "href",
      "/leads/lead_1"
    );

    fireEvent.click(screen.getByLabelText("Select visible leads"));
    expect(screen.getByText("2 selected")).toBeInTheDocument();
    expect(screen.getByText("2 visible")).toBeInTheDocument();
  });

  it("creates an Email batch from selected leads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
          ok: true,
          json: async () => ({
            batch: {
              id: "batch_1",
              channel: "email",
              status: "draft",
              selectedCount: 1,
              eligibleCount: 1,
              missingContactCount: 0,
              invalidContactCount: 0,
              duplicateCount: 0
            },
            items: []
          })
        }))
    );

    render(<LeadTable leads={leads} />);
    fireEvent.click(screen.getByLabelText("Select Example Clinic"));
    fireEvent.click(screen.getByRole("button", { name: /Generate Email/i }));

    await waitFor(() => expect(screen.getByText("Batch created")).toBeInTheDocument());
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/freelance/bulk-outreach",
      expect.objectContaining({
        method: "POST"
      })
    );
  });

  it("shows generated items and saves review edits", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.endsWith("/generate")) {
        return {
          ok: true,
          json: async () => ({
            batch: {
              id: "batch_1",
              channel: "email",
              status: "completed",
              selectedCount: 1,
              eligibleCount: 1,
              missingContactCount: 0,
              invalidContactCount: 0,
              duplicateCount: 0,
              generatedCount: 1,
              failedCount: 0
            },
            items: [
              {
                id: "item_1",
                leadId: "lead_1",
                channel: "email",
                status: "generated",
                recipientEmail: "owner@example.com",
                subject: "Quick idea",
                body: "Hello"
              }
            ]
          })
        };
      }
      if (url.endsWith("/items/item_1")) {
        return {
          ok: true,
          json: async () => ({
            batch: {
              id: "batch_1",
              channel: "email",
              status: "completed",
              selectedCount: 1,
              eligibleCount: 1,
              missingContactCount: 0,
              invalidContactCount: 0,
              duplicateCount: 0,
              generatedCount: 1,
              failedCount: 0
            },
            item: {
              id: "item_1",
              leadId: "lead_1",
              channel: "email",
              status: "generated",
              recipientEmail: "new@example.com",
              subject: "Updated",
              body: "Updated body"
            }
          })
        };
      }
      return {
        ok: true,
        json: async () => ({
          batch: {
            id: "batch_1",
            channel: "email",
            status: "draft",
            selectedCount: 1,
            eligibleCount: 1,
            missingContactCount: 0,
            invalidContactCount: 0,
            duplicateCount: 0
          },
          items: []
        })
      };
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<LeadTable leads={leads} />);
    fireEvent.click(screen.getByLabelText("Select Example Clinic"));
    fireEvent.click(screen.getByRole("button", { name: /Generate Email/i }));
    await waitFor(() => expect(screen.getByText("Batch created")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Generate drafts" }));
    await waitFor(() => expect(screen.getByLabelText("Recipient email")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText("Recipient email"), {
      target: { value: "new@example.com" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save email item" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/items/item_1"), expect.any(Object)));
  });
});

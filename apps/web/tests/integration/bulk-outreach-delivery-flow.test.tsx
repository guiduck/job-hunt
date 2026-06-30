import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BulkOutreachPanel } from "@/components/leads/bulk-outreach-panel";

describe("bulk outreach delivery flow", () => {
  it("confirms Email approval, excludes skipped items, and shows outcomes", async () => {
    const onApprove = vi.fn();
    render(
      <BulkOutreachPanel
        batch={{
          id: "batch_1",
          channel: "email",
          status: "completed",
          selectedCount: 2,
          eligibleCount: 1,
          missingContactCount: 0,
          invalidContactCount: 0,
          duplicateCount: 0,
          generatedCount: 1,
          failedCount: 0
        }}
        onApprove={onApprove}
        deliveryResults={[
          { itemId: "item_1", status: "sent", providerName: "resend" },
          { itemId: "item_2", status: "skipped", diagnosticMessage: "Skipped by operator." }
        ]}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Approve Email delivery" }));

    expect(onApprove).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/skipped, duplicate, invalid/i)).toBeInTheDocument();
    expect(screen.getByText(/item_1: sent via resend/i)).toBeInTheDocument();
    expect(screen.getByText(/item_2: skipped - Skipped by operator./i)).toBeInTheDocument();
  });

  it("shows channel readiness diagnostics for local configuration debugging", () => {
    render(
      <BulkOutreachPanel
        batch={{
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
        }}
        channelReadiness={{
          status: "missing_config",
          providerName: "resend",
          missingEnvVars: ["RESEND_API_KEY"],
          diagnosticMessage: "Configure RESEND_API_KEY before sending email."
        }}
      />
    );

    expect(screen.getByText(/Configure RESEND_API_KEY/)).toBeInTheDocument();
    expect(screen.getByText(/Missing env: RESEND_API_KEY/)).toBeInTheDocument();
  });
});

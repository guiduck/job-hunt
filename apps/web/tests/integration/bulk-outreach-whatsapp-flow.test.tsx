import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BulkOutreachPanel } from "@/components/leads/bulk-outreach-panel";

describe("bulk outreach WhatsApp flow", () => {
  it("shows blocked diagnostics when WhatsApp is missing configuration", () => {
    render(
      <BulkOutreachPanel
        batch={{
          id: "batch_1",
          channel: "whatsapp",
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
          providerName: "twilio",
          missingEnvVars: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"],
          diagnosticMessage: "Configure TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN before sending WhatsApp messages."
        }}
      />
    );

    expect(screen.getByText(/Configure TWILIO_ACCOUNT_SID/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve WhatsApp delivery" })).toBeInTheDocument();
  });

  it("shows configured WhatsApp delivery outcomes", () => {
    render(
      <BulkOutreachPanel
        batch={{
          id: "batch_1",
          channel: "whatsapp",
          status: "sent",
          selectedCount: 1,
          eligibleCount: 1,
          missingContactCount: 0,
          invalidContactCount: 0,
          duplicateCount: 0,
          generatedCount: 1,
          failedCount: 0
        }}
        deliveryResults={[{ itemId: "item_1", status: "sent", providerName: "twilio" }]}
      />
    );

    expect(screen.getByText(/item_1: sent via twilio/i)).toBeInTheDocument();
  });
});

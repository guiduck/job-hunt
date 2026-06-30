import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BulkOutreachItemEditor } from "@/components/leads/bulk-outreach-item-editor";
import { BulkOutreachPanel } from "@/components/leads/bulk-outreach-panel";

describe("bulk outreach accessibility", () => {
  it("labels Email review controls and approval actions", () => {
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
        items={[
          {
            id: "item_1",
            leadId: "lead_1",
            channel: "email",
            status: "generated",
            recipientEmail: "owner@example.com",
            subject: "Quick idea",
            body: "Hello"
          }
        ]}
        onApprove={vi.fn()}
        onSaveItem={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Recipient email")).toBeInTheDocument();
    expect(screen.getByLabelText("Email subject")).toBeInTheDocument();
    expect(screen.getByLabelText("Email body")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve Email delivery" })).toBeInTheDocument();
  });

  it("labels WhatsApp review controls and validation messages", () => {
    render(
      <BulkOutreachItemEditor
        item={{
          id: "item_1",
          leadId: "lead_1",
          channel: "whatsapp",
          status: "invalid_contact",
          recipientWhatsapp: "123",
          message: "Hello",
          validationErrorMessage: "Review and correct this phone number before approval."
        }}
        onSave={vi.fn()}
      />
    );

    expect(screen.getByLabelText("WhatsApp recipient")).toBeInTheDocument();
    expect(screen.getByLabelText("WhatsApp message")).toBeInTheDocument();
    expect(screen.getByText(/correct this phone number/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save WhatsApp item" })).toBeInTheDocument();
  });
});

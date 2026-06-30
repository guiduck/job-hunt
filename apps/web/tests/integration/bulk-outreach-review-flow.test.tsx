import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BulkOutreachReview } from "@/components/leads/bulk-outreach-review";

describe("bulk outreach review flow", () => {
  it("renders generated item editors for review before approval", () => {
    render(
      <BulkOutreachReview
        channel="email"
        generatedCount={1}
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
      />
    );

    expect(screen.getByText("Generation context")).toBeInTheDocument();
    expect(screen.getByLabelText("Recipient email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save email item" })).toBeInTheDocument();
  });
});

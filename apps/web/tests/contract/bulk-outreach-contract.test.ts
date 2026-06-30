import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const approveBulkOutreachBatchMock = vi.fn();

vi.mock("@/lib/freelance/outreach-delivery-service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/freelance/outreach-delivery-service")>(
    "@/lib/freelance/outreach-delivery-service"
  );
  return {
    ...actual,
    approveBulkOutreachBatch: approveBulkOutreachBatchMock
  };
});

vi.mock("@/lib/freelance/current-user", () => ({
  getCurrentUserScope: vi.fn(async () => ({ userId: "bulk-outreach-user" }))
}));

const { POST: approveBatch } = await import(
  "@/app/api/freelance/bulk-outreach/[batchId]/approve/route"
);
const { ChannelNotReadyError } = await import("@/lib/freelance/outreach-delivery-service");

const apiContract = readFileSync(
  resolve(process.cwd(), "../../specs/016-freelance-bulk-outreach/contracts/api.md"),
  "utf8"
);

describe("bulk outreach API contract", () => {
  beforeEach(() => {
    approveBulkOutreachBatchMock.mockReset();
  });

  it("documents channel-specific batch creation", () => {
    expect(apiContract).toContain("POST /api/freelance/bulk-outreach");
    expect(apiContract).toContain('"channel": "email"');
    expect(apiContract.toLowerCase()).toContain("niche candidates");
  });

  it("documents generation, review update, approval, settings, and history routes", () => {
    expect(apiContract).toContain("POST /api/freelance/bulk-outreach/{batchId}/generate");
    expect(apiContract).toContain('"retryFailed": true');
    expect(apiContract).toContain("Failed items keep failure diagnostics");
    expect(apiContract).toContain("PATCH /api/freelance/bulk-outreach/{batchId}/items/{itemId}");
    expect(apiContract).toContain("recipientEmail");
    expect(apiContract).toContain("recipientWhatsapp");
    expect(apiContract).toContain("POST /api/freelance/bulk-outreach/{batchId}/approve");
    expect(apiContract).toContain("GET /api/freelance/channel-settings");
    expect(apiContract).toContain("GET /api/freelance/leads/{leadId}/outreach-events");
  });

  it("approves Email delivery through the approve route", async () => {
    approveBulkOutreachBatchMock.mockResolvedValue({
      batch: { id: "batch_1", status: "sent", sentCount: 1, failedSendCount: 0 },
      results: [{ itemId: "item_1", status: "sent", providerName: "resend" }],
      channelReadiness: { status: "ready", providerName: "resend", missingEnvVars: [] }
    });

    const response = await approveBatch(
      new Request("http://localhost/api/freelance/bulk-outreach/batch_1/approve", {
        method: "POST",
        body: JSON.stringify({ confirm: true })
      }),
      { params: Promise.resolve({ batchId: "batch_1" }) }
    );

    const payload = await response.json();
    expect(response.status, JSON.stringify(payload)).toBe(200);
    expect(payload).toMatchObject({
      batch: { status: "sent" },
      results: [{ status: "sent", providerName: "resend" }]
    });
  });

  it("returns 409 channel_not_ready with safe missing env names", async () => {
    approveBulkOutreachBatchMock.mockRejectedValue(
      new ChannelNotReadyError({
        channel: "email",
        providerName: "resend",
        status: "missing_config",
        requiredEnvVars: ["RESEND_API_KEY", "FREELANCE_EMAIL_FROM"],
        missingEnvVars: ["RESEND_API_KEY"],
        diagnosticCode: "missing_env",
        diagnosticMessage: "Configure RESEND_API_KEY before sending email."
      })
    );

    const response = await approveBatch(
      new Request("http://localhost/api/freelance/bulk-outreach/batch_1/approve", {
        method: "POST",
        body: JSON.stringify({ confirm: true })
      }),
      { params: Promise.resolve({ batchId: "batch_1" }) }
    );

    const payload = await response.json();
    expect(response.status, JSON.stringify(payload)).toBe(409);
    expect(payload).toMatchObject({
      error: "channel_not_ready",
      missingEnvVars: ["RESEND_API_KEY"]
    });
  });
});

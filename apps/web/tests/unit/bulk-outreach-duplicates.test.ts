import { beforeEach, describe, expect, it, vi } from "vitest";

const findManyMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    outreachEvent: {
      findMany: findManyMock
    }
  }
}));

const { findDuplicateFirstContactOutreach } = await import(
  "@/lib/freelance/duplicate-outreach-service"
);

describe("bulk outreach duplicate blocking", () => {
  beforeEach(() => {
    findManyMock.mockReset();
  });

  it("blocks when the latest first-contact event is sent", async () => {
    findManyMock.mockResolvedValue([{ id: "event_1", eventType: "sent", status: "sent" }]);

    await expect(
      findDuplicateFirstContactOutreach(
        { userId: "user_1" },
        {
          leadId: "lead_1",
          campaignId: "campaign_1",
          channel: "email",
          stage: "first_contact"
        }
      )
    ).resolves.toMatchObject({ id: "event_1" });

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user_1",
          leadId: "lead_1",
          campaignId: "campaign_1",
          channel: "email",
          stage: "first_contact"
        }),
        orderBy: { occurredAt: "desc" },
        take: 5
      })
    );
  });

  it("blocks when the latest first-contact event is still pending", async () => {
    findManyMock.mockResolvedValue([{ id: "event_queued", eventType: "queued_send", status: "sending" }]);

    await expect(
      findDuplicateFirstContactOutreach(
        { userId: "user_1" },
        {
          leadId: "lead_1",
          campaignId: "campaign_1",
          channel: "whatsapp",
          stage: "first_contact"
        }
      )
    ).resolves.toMatchObject({ id: "event_queued" });
  });

  it("allows a corrected recipient while still blocking the same recipient", async () => {
    findManyMock.mockResolvedValue([
      { id: "event_old", eventType: "sent", status: "sent", recipient: "+556182724656" }
    ]);

    await expect(
      findDuplicateFirstContactOutreach(
        { userId: "user_1" },
        {
          leadId: "lead_1",
          campaignId: "campaign_1",
          channel: "whatsapp",
          stage: "first_contact",
          recipient: "+5561982724656"
        }
      )
    ).resolves.toBeNull();
  });

  it("allows retry when the latest first-contact delivery failed", async () => {
    findManyMock.mockResolvedValue([
      { id: "event_failed", eventType: "failed_send", status: "failed_send" },
      { id: "event_queued", eventType: "queued_send", status: "sending" }
    ]);

    await expect(
      findDuplicateFirstContactOutreach(
        { userId: "user_1" },
        {
          leadId: "lead_1",
          campaignId: "campaign_1",
          channel: "whatsapp",
          stage: "first_contact"
        }
      )
    ).resolves.toBeNull();
  });
});

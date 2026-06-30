import { beforeEach, describe, expect, it, vi } from "vitest";

const findFirstMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    outreachEvent: {
      findFirst: findFirstMock
    }
  }
}));

const { findDuplicateFirstContactOutreach } = await import(
  "@/lib/freelance/duplicate-outreach-service"
);

describe("bulk outreach duplicate blocking", () => {
  beforeEach(() => {
    findFirstMock.mockReset();
  });

  it("looks up first-contact duplicates by lead, campaign, channel, and stage", async () => {
    findFirstMock.mockResolvedValue({ id: "event_1", status: "sent" });

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

    expect(findFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user_1",
          leadId: "lead_1",
          campaignId: "campaign_1",
          channel: "email",
          stage: "first_contact"
        })
      })
    );
  });
});

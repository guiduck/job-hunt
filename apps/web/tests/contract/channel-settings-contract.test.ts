import { beforeEach, describe, expect, it, vi } from "vitest";

const getChannelSettingsMock = vi.fn();
const updateChannelSettingMock = vi.fn();

vi.mock("@/lib/freelance/channel-settings-service", () => ({
  getChannelSettings: getChannelSettingsMock,
  updateChannelSetting: updateChannelSettingMock
}));

vi.mock("@/lib/freelance/current-user", () => ({
  getCurrentUserScope: vi.fn(async () => ({ userId: "bulk-outreach-user" }))
}));

const { GET, PATCH } = await import("@/app/api/freelance/channel-settings/route");

describe("channel settings API contract", () => {
  beforeEach(() => {
    getChannelSettingsMock.mockReset();
    updateChannelSettingMock.mockReset();
  });

  it("returns secret-safe readiness for Email and WhatsApp", async () => {
    getChannelSettingsMock.mockResolvedValue([
      {
        channel: "email",
        providerName: "resend",
        status: "missing_config",
        missingEnvVars: ["RESEND_API_KEY"],
        diagnosticMessage: "Configure RESEND_API_KEY before sending email."
      },
      {
        channel: "whatsapp",
        providerName: "twilio",
        status: "missing_config",
        missingEnvVars: ["TWILIO_AUTH_TOKEN"],
        diagnosticMessage: "Configure TWILIO_AUTH_TOKEN before sending WhatsApp messages."
      }
    ]);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.items).toHaveLength(2);
    expect(JSON.stringify(payload)).toContain("TWILIO_AUTH_TOKEN");
    expect(JSON.stringify(payload)).not.toContain("secret-value");
  });

  it("saves display metadata without accepting provider secrets", async () => {
    updateChannelSettingMock.mockResolvedValue({
      channel: "email",
      providerName: "resend",
      displayAddress: "hello@example.com"
    });

    const response = await PATCH(
      new Request("http://localhost/api/freelance/channel-settings", {
        method: "PATCH",
        body: JSON.stringify({
          channel: "email",
          enabled: true,
          providerName: "resend",
          displayAddress: "hello@example.com"
        })
      })
    );

    expect(response.status).toBe(200);
    expect(updateChannelSettingMock).toHaveBeenCalledWith(
      { userId: "bulk-outreach-user" },
      expect.objectContaining({ channel: "email", displayAddress: "hello@example.com" })
    );
  });
});

import { describe, expect, it } from "vitest";
import {
  bulkOutreachApproveSchema,
  bulkOutreachCreateSchema,
  bulkOutreachGenerateSchema,
  bulkOutreachItemUpdateSchema,
  channelReadinessSchema,
  channelSettingsSchema
} from "@/lib/validation/freelance";

describe("bulk outreach validation", () => {
  it("accepts channel-specific batch creation payloads", () => {
    expect(
      bulkOutreachCreateSchema.parse({
        channel: "email",
        leadIds: ["lead_1"],
        templateId: "template_1"
      })
    ).toMatchObject({ channel: "email", stage: "first_contact" });

    expect(() => bulkOutreachCreateSchema.parse({ channel: "sms", leadIds: ["lead_1"] })).toThrow();
    expect(() => bulkOutreachCreateSchema.parse({ channel: "email", leadIds: [] })).toThrow();
  });

  it("validates generate, update, approve, and settings payloads", () => {
    expect(bulkOutreachGenerateSchema.parse({ retryFailed: true }).retryFailed).toBe(true);
    expect(bulkOutreachItemUpdateSchema.parse({ recipientEmail: "owner@example.com" })).toBeTruthy();
    expect(() => bulkOutreachItemUpdateSchema.parse({ recipientEmail: "nope" })).toThrow();
    expect(bulkOutreachApproveSchema.parse({ confirm: true }).confirm).toBe(true);
    expect(() => bulkOutreachApproveSchema.parse({ confirm: false })).toThrow();
    expect(channelSettingsSchema.parse({ channel: "whatsapp", enabled: true }).channel).toBe(
      "whatsapp"
    );
  });

  it("accepts secret-safe readiness diagnostics", () => {
    expect(
      channelReadinessSchema.parse({
        channel: "email",
        providerName: "resend",
        status: "missing_config",
        requiredEnvVars: ["RESEND_API_KEY"],
        missingEnvVars: ["RESEND_API_KEY"],
        diagnosticCode: "missing_env"
      }).missingEnvVars
    ).toEqual(["RESEND_API_KEY"]);
  });
});

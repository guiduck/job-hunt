import { describe, expect, it } from "vitest";
import { commercialTemplateSchema } from "@/lib/validation/freelance";

describe("template management integration", () => {
  it("parses create and update payloads for commercial templates", () => {
    const payload = commercialTemplateSchema.parse({
      name: "Follow-up",
      stage: "follow_up",
      channel: "whatsapp",
      bodyTemplate: "Oi {{business_name}}, passando para deixar o demo: {{demo_url}}",
      isActive: true
    });

    expect(payload.stage).toBe("follow_up");
    expect(payload.channel).toBe("whatsapp");
  });
});

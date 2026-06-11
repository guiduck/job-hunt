import { describe, expect, it } from "vitest";
import { commercialTemplateSchema } from "@/lib/validation/freelance";
import { findTemplateVariables } from "@/lib/generation/commercial-message-builder";

describe("template variable validation", () => {
  it("accepts commercial templates with known variable syntax", () => {
    const template = commercialTemplateSchema.parse({
      name: "WhatsApp first contact",
      stage: "first_contact",
      channel: "whatsapp",
      bodyTemplate: "Oi {{business_name}}, fiz uma ideia para {{city}}.",
      isActive: true
    });

    expect(findTemplateVariables(template.bodyTemplate)).toEqual(["business_name", "city"]);
  });
});

import { WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY } from "../../lib/freelance/whatsapp-template-definition";

export const seedCommercialTemplates = [
  {
    id: "system-first_contact-default",
    name: "First contact - email opportunity",
    stage: "first_contact" as const,
    category: "default",
    channel: "email",
    bodyTemplate:
      "Hi {{business_name}}, I reviewed your current online presence and found a practical opportunity to improve conversion for {{niche}} in {{city}}. I can prepare a focused landing page/demo for {{offer_price}} with delivery in {{delivery_time}}.",
    variablesSchema: {
      required: ["business_name", "niche", "city", "seller_name"],
      optional: ["demo_url", "offer_price", "installments", "website_score"]
    }
  },
  {
    id: "system-first_contact-twilio",
    name: "WhatsApp first contact - Twilio template v2",
    stage: "first_contact" as const,
    category: "twilio_first_contact",
    channel: "whatsapp",
    bodyTemplate: WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY,
    variablesSchema: {
      required: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      optional: []
    }
  },
  {
    id: "system-follow_up-default",
    name: "Follow-up - demo reminder",
    stage: "follow_up" as const,
    category: "default",
    channel: "any",
    bodyTemplate:
      "Hi {{business_name}}, just following up on the landing page idea. The demo link is {{demo_url}}. If this direction makes sense, I can adapt it with your services, photos, and contact flow.",
    variablesSchema: {
      required: ["business_name", "demo_url"],
      optional: ["seller_name", "seller_whatsapp"]
    }
  }
];

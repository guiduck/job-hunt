import { CheckCircle2, CircleAlert } from "lucide-react";
import {
  WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY,
  WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY_EN,
  WHATSAPP_FIRST_CONTACT_TEMPLATE_NAME,
  WHATSAPP_FIRST_CONTACT_TEMPLATE_NAME_EN,
  WHATSAPP_FIRST_CONTACT_VARIABLES
} from "@/lib/freelance/whatsapp-template-definition";

const templates = [
  {
    language: "Portuguese (BR)",
    name: WHATSAPP_FIRST_CONTACT_TEMPLATE_NAME,
    body: WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY,
    envName: "TWILIO_WHATSAPP_TEMPLATE_CONTENT_SID_V2",
    configured: Boolean(process.env.TWILIO_WHATSAPP_TEMPLATE_CONTENT_SID_V2)
  },
  {
    language: "English",
    name: WHATSAPP_FIRST_CONTACT_TEMPLATE_NAME_EN,
    body: WHATSAPP_FIRST_CONTACT_TEMPLATE_BODY_EN,
    envName: "TWILIO_WHATSAPP_TEMPLATE_CONTENT_SID_EN_V2",
    configured: Boolean(process.env.TWILIO_WHATSAPP_TEMPLATE_CONTENT_SID_EN_V2)
  }
];

export function TwilioTemplateCatalog() {
  return (
    <section className="space-y-3" aria-labelledby="twilio-template-heading">
      <div>
        <h2 id="twilio-template-heading" className="text-lg font-semibold text-slate-100">
          WhatsApp first contact
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Active Twilio templates. Language is selected automatically from the lead market. V2 SIDs
          are required before delivery.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {templates.map((template) => (
          <article
            key={template.name}
            className="rounded-md border border-slate-800 bg-slate-950 p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-100">{template.language}</h3>
                <p className="mt-1 text-xs text-slate-500">{template.name}</p>
              </div>
              <span
                className={
                  template.configured
                    ? "inline-flex items-center gap-1 text-xs text-emerald-300"
                    : "inline-flex items-center gap-1 text-xs text-amber-300"
                }
              >
                {template.configured ? (
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <CircleAlert className="h-4 w-4" aria-hidden="true" />
                )}
                {template.configured ? "SID configured" : template.envName + " missing"}
              </span>
            </div>
            <pre className="mt-4 whitespace-pre-wrap break-words rounded-md border border-slate-800 bg-slate-900/60 p-3 font-sans text-sm leading-6 text-slate-200">
              {template.body}
            </pre>
          </article>
        ))}
      </div>
      <div className="flex flex-wrap gap-2" aria-label="WhatsApp template variables">
        {WHATSAPP_FIRST_CONTACT_VARIABLES.map(([key, label]) => (
          <span
            key={key}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300"
          >
            {"{{" + key + "}}"} {label}
          </span>
        ))}
      </div>
    </section>
  );
}

import { TemplateEditorDialog } from "@/components/templates/template-editor-dialog";
import { TemplateList, type TemplateListItem } from "@/components/templates/template-list";
import { TwilioTemplateCatalog } from "@/components/templates/twilio-template-catalog";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import { listCommercialTemplates } from "@/lib/freelance/template-service";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templates = await listCommercialTemplates(await getCurrentUserScope());
  const templateItems: TemplateListItem[] = templates
    .filter((template) => template.category !== "twilio_first_contact")
    .map((template) => ({
    id: template.id,
    name: template.name,
    stage: template.stage,
    category: template.category,
    channel: template.channel as TemplateListItem["channel"],
    bodyTemplate: template.bodyTemplate,
    isDefault: template.isDefault,
    isActive: template.isActive
    }));

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">Templates</p>
        <h1 className="mt-3 text-3xl font-semibold">Commercial templates</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Manage reusable first-contact and follow-up text for generated messages.
        </p>
      </div>
      <TwilioTemplateCatalog />
      <section className="space-y-3" aria-labelledby="internal-template-heading">
        <h2 id="internal-template-heading" className="text-lg font-semibold text-slate-100">
          Email and follow-up templates
        </h2>
        <TemplateEditorDialog />
        <TemplateList templates={templateItems} />
      </section>
    </div>
  );
}


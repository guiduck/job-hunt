import { TemplateEditorDialog } from "@/components/templates/template-editor-dialog";
import { TemplateList } from "@/components/templates/template-list";
import { getCurrentUserScope } from "@/lib/freelance/current-user";
import { listCommercialTemplates } from "@/lib/freelance/template-service";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templates = await listCommercialTemplates(await getCurrentUserScope());

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-300">Templates</p>
        <h1 className="mt-3 text-3xl font-semibold">Commercial templates</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Manage reusable first-contact and follow-up text for generated messages.
        </p>
      </div>
      <TemplateEditorDialog />
      <TemplateList templates={templates} />
    </div>
  );
}

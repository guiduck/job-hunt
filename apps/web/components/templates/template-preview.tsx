import { findTemplateVariables } from "@/lib/generation/commercial-message-builder";

export function TemplatePreview({ bodyTemplate }: { bodyTemplate: string }) {
  const variables = findTemplateVariables(bodyTemplate);
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950 p-3 text-sm">
      <p className="whitespace-pre-wrap text-slate-300">{bodyTemplate}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {variables.map((variable) => (
          <span key={variable} className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300">
            {variable}
          </span>
        ))}
      </div>
    </div>
  );
}

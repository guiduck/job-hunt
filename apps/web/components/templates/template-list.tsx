import type { CommercialTemplate } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TemplatePreview } from "./template-preview";

export function TemplateList({ templates }: { templates: CommercialTemplate[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {templates.map((template) => (
        <Card key={template.id}>
          <CardHeader>
            <CardTitle>{template.name}</CardTitle>
            <p className="text-xs text-slate-500">
              {template.stage} / {template.channel}
              {template.isDefault ? " / system default" : ""}
            </p>
          </CardHeader>
          <CardContent>
            <TemplatePreview bodyTemplate={template.bodyTemplate} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

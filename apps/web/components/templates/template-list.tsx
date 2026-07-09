"use client";

import { Pencil, Save, Trash2, X } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TemplatePreview } from "./template-preview";

export type TemplateListItem = {
  id: string;
  name: string;
  stage: "first_contact" | "follow_up";
  category: string | null;
  channel: "email" | "whatsapp" | "any";
  bodyTemplate: string;
  isDefault: boolean;
  isActive: boolean;
};

type TemplateFormState = Pick<
  TemplateListItem,
  "name" | "stage" | "category" | "channel" | "bodyTemplate" | "isActive"
>;

function toFormState(template: TemplateListItem): TemplateFormState {
  return {
    name: template.name,
    stage: template.stage,
    category: template.category ?? "",
    channel: template.channel,
    bodyTemplate: template.bodyTemplate,
    isActive: template.isActive
  };
}

export function TemplateList({ templates }: { templates: TemplateListItem[] }) {
  const [items, setItems] = useState(templates);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<TemplateFormState | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function startEditing(template: TemplateListItem) {
    setMessage("");
    setEditingId(template.id);
    setFormState(toFormState(template));
  }

  function cancelEditing() {
    setEditingId(null);
    setFormState(null);
    setMessage("");
  }

  function updateField<K extends keyof TemplateFormState>(key: K, value: TemplateFormState[K]) {
    setFormState((current) => (current ? { ...current, [key]: value } : current));
  }

  function saveTemplate(templateId: string) {
    if (!formState) return;
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/freelance/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formState,
          category: formState.category || null,
          isActive: true
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload.error ?? "Unable to update template.");
        return;
      }
      setItems((current) => current.map((item) => (item.id === templateId ? payload : item)));
      setEditingId(null);
      setFormState(null);
      setMessage("Template updated.");
    });
  }

  function deleteTemplate(templateId: string) {
    const template = items.find((item) => item.id === templateId);
    if (!template) return;
    if (!window.confirm(`Delete template "${template.name}"?`)) return;

    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/freelance/templates/${templateId}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload.error ?? "Unable to delete template.");
        return;
      }
      setItems((current) => current.filter((item) => item.id !== templateId));
      if (editingId === templateId) cancelEditing();
      setMessage("Template deleted.");
    });
  }

  return (
    <div className="space-y-3">
      {message ? <p className="text-sm text-slate-400">{message}</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((template) => {
          const isEditing = editingId === template.id && formState;

          return (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{template.name}</CardTitle>
                    <p className="text-xs text-slate-500">
                      {template.stage} / {template.channel}
                      {template.isDefault ? " / system default" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {isEditing ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={cancelEditing}
                        disabled={isPending}
                        title="Cancel editing"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                        Cancel
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => startEditing(template)}
                        disabled={isPending}
                        title="Edit template"
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => deleteTemplate(template.id)}
                      disabled={isPending}
                      title="Delete template"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-3">
                      <Input
                        value={formState.name}
                        onChange={(event) => updateField("name", event.target.value)}
                        aria-label="Template name"
                      />
                      <Select
                        value={formState.stage}
                        onChange={(event) =>
                          updateField("stage", event.target.value as TemplateFormState["stage"])
                        }
                        aria-label="Template stage"
                      >
                        <option value="first_contact">First contact</option>
                        <option value="follow_up">Follow-up</option>
                      </Select>
                      <Select
                        value={formState.channel}
                        onChange={(event) =>
                          updateField("channel", event.target.value as TemplateFormState["channel"])
                        }
                        aria-label="Template channel"
                      >
                        <option value="any">Any channel</option>
                        <option value="whatsapp">WhatsApp</option>
                        <option value="email">Email</option>
                      </Select>
                    </div>
                    <Input
                      value={formState.category ?? ""}
                      onChange={(event) => updateField("category", event.target.value)}
                      placeholder="Optional category"
                      aria-label="Template category"
                    />
                    <textarea
                      value={formState.bodyTemplate}
                      onChange={(event) => updateField("bodyTemplate", event.target.value)}
                      className="min-h-32 w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
                      aria-label="Template body"
                    />
                    <Button size="sm" onClick={() => saveTemplate(template.id)} disabled={isPending}>
                      <Save className="h-4 w-4" aria-hidden="true" />
                      {isPending ? "Saving..." : "Save changes"}
                    </Button>
                  </div>
                ) : (
                  <TemplatePreview bodyTemplate={template.bodyTemplate} />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}


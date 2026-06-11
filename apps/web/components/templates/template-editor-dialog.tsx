"use client";

import { Plus, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function TemplateEditorDialog() {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function create(formData: FormData) {
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/freelance/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          stage: formData.get("stage"),
          channel: formData.get("channel"),
          category: formData.get("category"),
          bodyTemplate: formData.get("bodyTemplate"),
          isActive: true
        })
      });
      setMessage(response.ok ? "Template created. Refresh to see it in the list." : "Unable to create template.");
    });
  }

  return (
    <form action={create} className="space-y-3 rounded-lg border border-slate-800 bg-slate-950 p-4">
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 text-cyan-300" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-slate-100">New template</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Input name="name" placeholder="Name" required />
        <Select name="stage" defaultValue="first_contact">
          <option value="first_contact">First contact</option>
          <option value="follow_up">Follow-up</option>
        </Select>
        <Select name="channel" defaultValue="any">
          <option value="any">Any channel</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="email">Email</option>
        </Select>
      </div>
      <Input name="category" placeholder="Optional category" />
      <textarea
        name="bodyTemplate"
        required
        className="min-h-36 w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
        placeholder="Hi {{business_name}}, ..."
      />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          <Save className="h-4 w-4" aria-hidden="true" />
          Save template
        </Button>
        {message ? <span className="text-xs text-slate-400">{message}</span> : null}
      </div>
    </form>
  );
}

"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { NicheDto } from "@/lib/freelance/campaign-service";
import { slugifyNiche } from "@/lib/freelance/niche-normalization";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { NicheConflictWarning } from "./niche-conflict-warning";

function splitTerms(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function NicheForm({ initialNiche }: { initialNiche?: NicheDto }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialNiche?.displayName ?? "");
  const [enabled, setEnabled] = useState(initialNiche?.enabled ?? true);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const slugPreview = useMemo(() => slugifyNiche(displayName), [displayName]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      displayName,
      marketApplicability: String(formData.get("marketApplicability") || "both"),
      conversionHint: Number(formData.get("conversionHint") || 0),
      conversionHintSource: String(formData.get("conversionHintSource") || "operator_override"),
      aliases: splitTerms(formData.get("aliases")),
      queryTerms: splitTerms(formData.get("queryTerms")),
      sourcePath: String(formData.get("sourcePath") || ""),
      sourceNote: String(formData.get("sourceNote") || ""),
      enabled,
      sortOrder: Number(formData.get("sortOrder") || 0),
      ...(initialNiche ? { lifecycleStatus: enabled ? "approved" : "disabled" } : {})
    };

    const response = await fetch(
      initialNiche ? `/api/freelance/niches/${initialNiche.id}` : "/api/freelance/niches",
      {
        method: initialNiche ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(body?.error ?? "Unable to save niche.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setMessage(initialNiche ? "Niche updated." : "Niche created.");
    if (!initialNiche) {
      event.currentTarget.reset();
      setDisplayName("");
      setEnabled(true);
    }
    router.refresh();
  }

  return (
    <form className="space-y-4 rounded-md border border-slate-800 p-4" onSubmit={onSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs text-slate-400">
          Display name
          <Input
            required
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Solar Installer"
          />
        </label>
        <label className="space-y-1 text-xs text-slate-400">
          Market
          <Select name="marketApplicability" defaultValue={initialNiche?.marketApplicability ?? "both"}>
            <option value="BR">BR</option>
            <option value="INTERNATIONAL">International</option>
            <option value="both">Both</option>
          </Select>
        </label>
      </div>

      <p className="text-xs text-slate-500">Slug preview: {slugPreview || "type a display name"}</p>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1 text-xs text-slate-400">
          Conversion hint
          <Input
            name="conversionHint"
            type="number"
            min={0}
            max={100}
            step="0.1"
            defaultValue={initialNiche?.conversionHint ?? 0}
          />
        </label>
        <label className="space-y-1 text-xs text-slate-400">
          Hint source
          <Select name="conversionHintSource" defaultValue={initialNiche?.conversionHintSource ?? "operator_override"}>
            <option value="text_seed">Text seed</option>
            <option value="visual_reference">Visual reference</option>
            <option value="operator_override">Operator override</option>
          </Select>
        </label>
        <label className="space-y-1 text-xs text-slate-400">
          Sort order
          <Input name="sortOrder" type="number" defaultValue={initialNiche?.sortOrder ?? 0} />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs text-slate-400">
          Aliases
          <Input name="aliases" defaultValue={initialNiche?.aliases.join(", ")} placeholder="Dentist, Dental clinic" />
        </label>
        <label className="space-y-1 text-xs text-slate-400">
          Query terms
          <Input name="queryTerms" required defaultValue={initialNiche?.queryTerms.join(", ")} placeholder="dentist, dental clinic" />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs text-slate-400">
          Source path
          <Input name="sourcePath" required defaultValue={initialNiche?.sourcePath ?? ""} placeholder="docs/reference-ui.md" />
        </label>
        <label className="space-y-1 text-xs text-slate-400">
          Source note
          <Input name="sourceNote" required defaultValue={initialNiche?.sourceNote ?? ""} placeholder="Operator-approved reference" />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          className="h-4 w-4 rounded border-slate-700 bg-slate-950"
        />
        Enabled for new campaigns
      </label>

      <NicheConflictWarning message={message} />

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !displayName.trim()}>
          {isSubmitting ? "Saving..." : initialNiche ? "Save niche" : "Create niche"}
        </Button>
      </div>
    </form>
  );
}

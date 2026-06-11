"use client";

import { Save } from "lucide-react";
import { useState, useTransition } from "react";
import type { CommercialStatus, LeadTemperature } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { commercialStatuses, leadTemperatures } from "@/lib/freelance/constants";

export function LeadReviewPanel({
  leadId,
  commercialStatus,
  temperature,
  demoUrl,
  operatorNotes
}: {
  leadId: string;
  commercialStatus: CommercialStatus;
  temperature: LeadTemperature;
  demoUrl?: string | null;
  operatorNotes?: string | null;
}) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function save(formData: FormData) {
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/freelance/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commercialStatus: formData.get("commercialStatus"),
          temperature: formData.get("temperature"),
          demoUrl: formData.get("demoUrl"),
          operatorNotes: formData.get("operatorNotes")
        })
      });
      setMessage(response.ok ? "Saved" : "Unable to save");
    });
  }

  return (
    <form action={save} className="space-y-3">
      <label className="block text-xs font-medium text-slate-400">
        Commercial status
        <Select name="commercialStatus" defaultValue={commercialStatus}>
          {commercialStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
      </label>
      <label className="block text-xs font-medium text-slate-400">
        Temperature
        <Select name="temperature" defaultValue={temperature}>
          {leadTemperatures.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </label>
      <label className="block text-xs font-medium text-slate-400">
        Demo URL
        <Input name="demoUrl" defaultValue={demoUrl ?? ""} placeholder="https://..." />
      </label>
      <label className="block text-xs font-medium text-slate-400">
        Notes
        <textarea
          name="operatorNotes"
          defaultValue={operatorNotes ?? ""}
          className="mt-1 min-h-28 w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
        />
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          <Save className="h-4 w-4" aria-hidden="true" />
          Save
        </Button>
        {message ? <span className="text-xs text-slate-400">{message}</span> : null}
      </div>
    </form>
  );
}

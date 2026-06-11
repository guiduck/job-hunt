"use client";

import { useState } from "react";
import { Archive, CheckCircle2, GitMerge, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import type { NicheDto } from "@/lib/freelance/campaign-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { NicheConflictWarning } from "./niche-conflict-warning";
import { NicheForm } from "./niche-form";

export function ApprovedNicheTable({ niches }: { niches: NicheDto[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mergeTargets, setMergeTargets] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  async function patchNiche(nicheId: string, payload: Record<string, unknown>) {
    setMessage(null);
    const response = await fetch(`/api/freelance/niches/${nicheId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(body?.error ?? "Unable to update niche.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-3">
      <NicheConflictWarning message={message} />
      <div className="overflow-x-auto rounded-md border border-slate-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Niche</TableHead>
              <TableHead>Market</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Evidence</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {niches.map((niche) => (
              <TableRow key={niche.id}>
                <TableCell>
                  <p className="font-medium">{niche.displayName}</p>
                  <p className="text-xs text-slate-500">{niche.slug}</p>
                </TableCell>
                <TableCell>{niche.marketApplicability}</TableCell>
                <TableCell>
                  <Badge tone={niche.enabled && niche.lifecycleStatus === "approved" ? "success" : "neutral"}>
                    {niche.lifecycleStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <p className="max-w-xs truncate text-xs text-slate-400">{niche.sourcePath}</p>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button size="icon" variant="ghost" title="Edit niche" onClick={() => setEditingId(editingId === niche.id ? null : niche.id)}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    {niche.enabled ? (
                      <Button size="icon" variant="ghost" title="Disable niche" onClick={() => patchNiche(niche.id, { lifecycleStatus: "disabled", enabled: false })}>
                        <Archive className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    ) : (
                      <Button size="icon" variant="ghost" title="Re-enable niche" onClick={() => patchNiche(niche.id, { lifecycleStatus: "approved", enabled: true })}>
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingId ? (
        <NicheForm initialNiche={niches.find((niche) => niche.id === editingId)} />
      ) : null}

      <div className="rounded-md border border-slate-800 p-4">
        <h3 className="text-sm font-semibold text-slate-100">Merge duplicate niche</h3>
        <p className="mt-1 text-xs text-slate-500">
          Merged niches stay visible in historical campaigns and disappear from new campaign selection.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <Select
            aria-label="Duplicate niche"
            value={mergeTargets.source ?? ""}
            onChange={(event) => setMergeTargets((current) => ({ ...current, source: event.target.value }))}
          >
            <option value="">Duplicate niche</option>
            {niches.map((niche) => (
              <option key={niche.id} value={niche.id}>
                {niche.displayName}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Merge target"
            value={mergeTargets.target ?? ""}
            onChange={(event) => setMergeTargets((current) => ({ ...current, target: event.target.value }))}
          >
            <option value="">Merge target</option>
            {niches
              .filter((niche) => niche.enabled && niche.lifecycleStatus === "approved")
              .map((niche) => (
                <option key={niche.id} value={niche.id}>
                  {niche.displayName}
                </option>
              ))}
          </Select>
          <Button
            variant="secondary"
            disabled={!mergeTargets.source || !mergeTargets.target}
            onClick={() =>
              patchNiche(mergeTargets.source, {
                lifecycleStatus: "merged",
                mergedIntoNicheId: mergeTargets.target
              })
            }
          >
            <GitMerge className="h-4 w-4" aria-hidden="true" />
            Merge
          </Button>
        </div>
      </div>
    </div>
  );
}

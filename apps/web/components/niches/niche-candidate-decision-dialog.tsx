"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Clock3, FileCheck2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import type { NicheDto } from "@/lib/freelance/campaign-service";
import type { NicheCandidateDto } from "@/lib/freelance/niche-candidate-service";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Decision = "approve" | "reject" | "defer" | "mark_already_covered";

export function NicheCandidateDecisionDialog({
  candidate,
  niches
}: {
  candidate: NicheCandidateDto;
  niches: NicheDto[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState<Decision>("approve");
  const [matchedNicheId, setMatchedNicheId] = useState(candidate.matchedNicheId ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const decisionReason = String(formData.get("decisionReason") ?? "").trim();
    const response = await fetch(`/api/freelance/niche-candidates/${candidate.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decision,
        ...(matchedNicheId ? { matchedNicheId } : {}),
        ...(decisionReason ? { decisionReason } : {})
      })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(body?.error ?? "Unable to update candidate.");
      return;
    }

    setOpen(false);
    router.refresh();
  }

  const needsReason = decision === "reject" || decision === "defer";
  const needsMatch = decision === "mark_already_covered";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" title="Review candidate">
          <FileCheck2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Review {candidate.proposedName}</DialogTitle>
          <DialogDescription>
            Candidate records are catalog suggestions only. They do not create business leads.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant={decision === "approve" ? "primary" : "secondary"}
              onClick={() => setDecision("approve")}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Approve into catalog
            </Button>
            <Button
              type="button"
              variant={decision === "mark_already_covered" ? "primary" : "secondary"}
              onClick={() => setDecision("mark_already_covered")}
            >
              <FileCheck2 className="h-4 w-4" aria-hidden="true" />
              Mark already covered
            </Button>
            <Button
              type="button"
              variant={decision === "defer" ? "primary" : "secondary"}
              onClick={() => setDecision("defer")}
            >
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              Defer
            </Button>
            <Button
              type="button"
              variant={decision === "reject" ? "primary" : "secondary"}
              onClick={() => setDecision("reject")}
            >
              <XCircle className="h-4 w-4" aria-hidden="true" />
              Reject
            </Button>
          </div>

          <label className="space-y-1 text-xs text-slate-400">
            Matched approved niche
            <Select
              value={matchedNicheId}
              required={needsMatch}
              onChange={(event) => setMatchedNicheId(event.target.value)}
            >
              <option value="">Select approved niche</option>
              {niches
                .filter((niche) => niche.enabled && niche.lifecycleStatus === "approved")
                .map((niche) => (
                  <option key={niche.id} value={niche.id}>
                    {niche.displayName}
                  </option>
                ))}
            </Select>
          </label>

          <label className="space-y-1 text-xs text-slate-400">
            Decision reason
            <Input
              name="decisionReason"
              required={needsReason}
              placeholder={needsReason ? "Why this candidate is not approved now" : "Optional note"}
            />
          </label>

          {message ? <p className="text-sm text-rose-300">{message}</p> : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || (needsMatch && !matchedNicheId)}>
              {isSubmitting ? "Saving..." : "Save decision"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

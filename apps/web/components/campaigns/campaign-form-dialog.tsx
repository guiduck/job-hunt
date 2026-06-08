"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { NicheDto } from "@/lib/freelance/campaign-service";
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

export function CampaignFormDialog({ niches }: { niches: NicheDto[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [marketScope, setMarketScope] = useState<"BR" | "INTERNATIONAL">("BR");
  const [nicheId, setNicheId] = useState(niches.find((niche) => niche.enabled)?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedNiche = useMemo(
    () => niches.find((niche) => niche.id === nicheId),
    [nicheId, niches]
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") || ""),
      marketScope,
      country: String(formData.get("country") || ""),
      region: String(formData.get("region") || ""),
      state: String(formData.get("state") || ""),
      city: String(formData.get("city") || ""),
      nicheId,
      searchSettings: {
        maxResults: Number(formData.get("maxResults") || 25)
      }
    };

    const response = await fetch("/api/freelance/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Unable to create campaign.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create campaign</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create campaign</DialogTitle>
          <DialogDescription className="text-sm text-slate-400">
            Choose a niche and locality for a Freelance prospecting run.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-slate-400">
              Market
              <Select
                value={marketScope}
                onChange={(event) =>
                  setMarketScope(event.target.value as "BR" | "INTERNATIONAL")
                }
              >
                <option value="BR">BR</option>
                <option value="INTERNATIONAL">International</option>
              </Select>
            </label>
            <label className="space-y-1 text-xs text-slate-400">
              Niche
              <Select value={nicheId} onChange={(event) => setNicheId(event.target.value)}>
                {niches
                  .filter((niche) => niche.enabled)
                  .map((niche) => (
                    <option key={niche.id} value={niche.id}>
                      {niche.name}
                    </option>
                  ))}
              </Select>
            </label>
          </div>

          {selectedNiche?.conversionHint != null ? (
            <p className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
              Conversion hint estimate: {selectedNiche.conversionHint.toFixed(1)}%.
              Use it as prioritization signal, not a promise.
            </p>
          ) : null}

          <label className="space-y-1 text-xs text-slate-400">
            Campaign name
            <Input name="name" placeholder="Optional, generated from niche and city" />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-slate-400">
              Country
              <Input
                name="country"
                required
                defaultValue={marketScope === "BR" ? "Brasil" : ""}
              />
            </label>
            <label className="space-y-1 text-xs text-slate-400">
              {marketScope === "BR" ? "State" : "State / region"}
              <Input name="state" placeholder={marketScope === "BR" ? "SC" : "TX"} />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-slate-400">
              Region
              <Input name="region" placeholder="Optional" />
            </label>
            <label className="space-y-1 text-xs text-slate-400">
              City
              <Input name="city" required placeholder={marketScope === "BR" ? "Indaial" : "Alamo"} />
            </label>
          </div>

          <label className="space-y-1 text-xs text-slate-400">
            Max results
            <Input name="maxResults" type="number" min={1} max={100} defaultValue={25} />
          </label>

          {error ? (
            <p className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

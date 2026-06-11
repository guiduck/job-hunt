"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProspectingJobDto } from "@/lib/freelance/campaign-service";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const providers = [
  { value: "serpapi_google_maps", label: "SerpApi Maps" },
  { value: "apify_google_maps", label: "Apify Maps" },
  { value: "mock", label: "Mock test" }
];

function isTerminalJob(status?: string) {
  return status ? ["completed", "completed_no_results", "failed"].includes(status) : false;
}

export function ProspectButton({
  campaignId,
  defaultMaxResults,
  initialJob,
  disabled
}: {
  campaignId: string;
  defaultMaxResults: number;
  initialJob?: ProspectingJobDto | null;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [providerName, setProviderName] = useState("serpapi_google_maps");
  const [job, setJob] = useState<ProspectingJobDto | null>(initialJob ?? null);
  const [message, setMessage] = useState<string | null>(null);

  async function pollJob(jobId: string) {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const response = await fetch(`/api/freelance/prospecting-jobs/${jobId}`);
      if (!response.ok) {
        continue;
      }
      const latestJob = (await response.json()) as ProspectingJobDto;
      setJob(latestJob);
      if (isTerminalJob(latestJob.status)) {
        setIsRunning(false);
        router.refresh();
        return;
      }
    }
    setIsRunning(false);
    setMessage("Still queued or running. Refresh in a moment, then check worker logs if it stays there.");
  }

  async function startProspecting() {
    setMessage(null);
    setIsRunning(true);
    const response = await fetch("/api/freelance/prospecting-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId, maxResults: defaultMaxResults, providerName })
    });
    if (!response.ok) {
      setIsRunning(false);
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(body?.error ?? `Unable to start prospecting. HTTP ${response.status}`);
      return;
    }
    const startedJob = (await response.json()) as ProspectingJobDto;
    setJob(startedJob);
    router.refresh();
    if (!isTerminalJob(startedJob.status)) {
      void pollJob(startedJob.id);
    } else {
      setIsRunning(false);
    }
  }

  const hasActiveJob = job ? !isTerminalJob(job.status) : false;

  return (
    <div className="w-full space-y-2">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <Select
          aria-label="Prospecting source"
          value={providerName}
          className="h-9 min-w-0 text-xs"
          onChange={(event) => setProviderName(event.target.value)}
        >
          {providers.map((provider) => (
            <option key={provider.value} value={provider.value}>
              {provider.label}
            </option>
          ))}
        </Select>
        <Button
          variant="ghost"
          size="sm"
          className="whitespace-nowrap"
          onClick={startProspecting}
          disabled={disabled || isRunning || hasActiveJob}
        >
          {isRunning || hasActiveJob ? "Prospecting..." : job ? "Prospect again" : "Prospect"}
        </Button>
      </div>
      {message ? <p className="text-xs text-rose-300">{message}</p> : null}
      {job ? (
        <div className="w-full rounded-md border border-slate-800 bg-slate-950/80 p-2 text-xs text-slate-400">
          <p>
            Job: <span className="text-slate-200">{job.status}</span> / {job.currentStep}
          </p>
          <p>
            Provider: {job.providerName} - max {job.requestedMaxResults}
          </p>
          <p>
            Seen {job.inspectedCount}, saved {job.acceptedCount}, rejected {job.rejectedCount},
            duplicates {job.duplicateCount}, failed {job.failedCount}
          </p>
          {job.status === "pending" && !job.startedAt ? (
            <p className="mt-1 text-amber-300">
              Queued. Waiting for the worker to pick this job up.
            </p>
          ) : null}
          {job.providerErrorMessage ? (
            <p className="mt-1 text-rose-300">{job.providerErrorMessage}</p>
          ) : null}
        </div>
      ) : null}
      {providerName === "mock" ? (
        <p className="max-w-xs text-xs text-amber-300">
          Mock returns 3 fake records for UI testing only.
        </p>
      ) : null}
    </div>
  );
}

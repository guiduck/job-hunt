"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { BulkOutreachCounters } from "./bulk-outreach-counters";
import { BulkOutreachPanel } from "./bulk-outreach-panel";
import type { BulkOutreachItemView } from "./bulk-outreach-item-editor";
import { TemperatureBadge, WebsiteStatusBadge } from "./lead-badges";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useFreelanceUiStore } from "@/lib/freelance/ui-store";

type LeadRow = {
  id: string;
  businessName: string;
  city: string;
  phone: string | null;
  whatsapp?: string | null;
  email?: string | null;
  websiteUrl: string | null;
  websiteStatus: string;
  leadScore: number;
  temperature: string;
  commercialStatus: string;
};

type CreatedBatch = {
  id: string;
  channel: "email" | "whatsapp";
  status: string;
  selectedCount: number;
  eligibleCount: number;
  missingContactCount: number;
  invalidContactCount: number;
  duplicateCount: number;
  generatedCount?: number;
  failedCount?: number;
};

export function LeadTable({ leads }: { leads: LeadRow[] }) {
  const [batch, setBatch] = useState<CreatedBatch | undefined>();
  const [items, setItems] = useState<BulkOutreachItemView[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [creatingChannel, setCreatingChannel] = useState<"email" | "whatsapp" | undefined>();
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [deliveryResults, setDeliveryResults] = useState<
    Array<{
      itemId: string;
      status: string;
      providerName?: string;
      providerMessageId?: string;
      diagnosticCode?: string;
      diagnosticMessage?: string;
    }>
  >([]);
  const [channelReadiness, setChannelReadiness] = useState<
    | {
        status: string;
        providerName: string;
        missingEnvVars?: string[];
        diagnosticMessage?: string;
        remainingToday?: number;
      }
    | undefined
  >();
  const selectedLeadIds = useFreelanceUiStore((state) => state.selectedLeadIds);
  const toggleLeadSelection = useFreelanceUiStore((state) => state.toggleLeadSelection);
  const selectVisibleLeads = useFreelanceUiStore((state) => state.selectVisibleLeads);
  const clearHiddenLeadSelection = useFreelanceUiStore((state) => state.clearHiddenLeadSelection);
  const visibleLeadIds = useMemo(() => leads.map((lead) => lead.id), [leads]);
  const selectedSet = useMemo(() => new Set(selectedLeadIds), [selectedLeadIds]);
  const visibleSelectedCount = visibleLeadIds.filter((id) => selectedSet.has(id)).length;
  const hiddenSelectedCount = Math.max(0, selectedLeadIds.length - visibleSelectedCount);
  const allVisibleSelected =
    visibleLeadIds.length > 0 && visibleLeadIds.every((id) => selectedSet.has(id));

  async function createBatch(channel: "email" | "whatsapp") {
    setCreatingChannel(channel);
    setError(undefined);
    setBatch(undefined);
    setItems([]);
    try {
      const response = await fetch("/api/freelance/bulk-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, leadIds: selectedLeadIds, stage: "first_contact" })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create bulk outreach batch.");
      }
      setBatch(payload.batch);
      setItems(payload.items ?? []);
      setDeliveryResults([]);
      setChannelReadiness(undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create bulk outreach batch.");
    } finally {
      setCreatingChannel(undefined);
    }
  }

  async function generateDrafts() {
    if (!batch) {
      return;
    }
    if (batch.eligibleCount === 0) {
      setError(
        batch.channel === "email"
          ? "No selected leads have saved email addresses. Email drafts were not generated; use WhatsApp or add emails first."
          : "No selected leads have WhatsApp-ready phone numbers. WhatsApp drafts were not generated; add phone numbers first."
      );
      return;
    }
    setGenerating(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/freelance/bulk-outreach/${batch.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retryFailed: true })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to generate drafts.");
      }
      setBatch(payload.batch);
      setItems(payload.items ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to generate drafts.");
    } finally {
      setGenerating(false);
    }
  }

  async function saveItem(itemId: string, payload: Record<string, unknown>) {
    if (!batch) {
      return;
    }
    const response = await fetch(`/api/freelance/bulk-outreach/${batch.id}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const responsePayload = await response.json();
    if (!response.ok) {
      throw new Error(responsePayload.error ?? "Unable to save outreach item.");
    }
    setBatch(responsePayload.batch);
    setItems((current) =>
      current.map((item) => (item.id === responsePayload.item.id ? responsePayload.item : item))
    );
  }

  async function approveDelivery() {
    if (!batch) {
      return;
    }
    setApproving(true);
    setError(undefined);
    try {
      const response = await fetch(`/api/freelance/bulk-outreach/${batch.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: true })
      });
      const payload = await response.json();
      if (!response.ok) {
        setChannelReadiness({
          status: payload.status ?? "channel_not_ready",
          providerName: payload.providerName ?? batch.channel,
          missingEnvVars: payload.missingEnvVars ?? [],
          diagnosticMessage: payload.diagnosticMessage ?? payload.error
        });
        throw new Error(payload.diagnosticMessage ?? payload.error ?? "Unable to approve delivery.");
      }
      setBatch(payload.batch);
      setDeliveryResults(payload.results ?? []);
      setChannelReadiness(payload.channelReadiness);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to approve delivery.");
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BulkOutreachCounters
          selectedCount={selectedLeadIds.length}
          visibleSelectedCount={visibleSelectedCount}
          hiddenSelectedCount={hiddenSelectedCount}
          onClearHidden={() => clearHiddenLeadSelection(visibleLeadIds)}
        />
        {selectedLeadIds.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => createBatch("email")}
              disabled={Boolean(creatingChannel)}
            >
              <Mail className="mr-2 h-4 w-4" />
              {creatingChannel === "email" ? "Creating..." : "Generate Email"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => createBatch("whatsapp")}
              disabled={Boolean(creatingChannel)}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              {creatingChannel === "whatsapp" ? "Creating..." : "Generate WhatsApp"}
            </Button>
          </div>
        ) : null}
      </div>
      <BulkOutreachPanel
        batch={batch}
        error={error}
        generating={generating}
        approving={approving}
        onGenerate={batch ? generateDrafts : undefined}
        onApprove={batch ? approveDelivery : undefined}
        items={items}
        onSaveItem={saveItem}
        deliveryResults={deliveryResults}
        channelReadiness={channelReadiness}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                aria-label="Select visible leads"
                checked={allVisibleSelected}
                onChange={() => selectVisibleLeads(visibleLeadIds)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950"
              />
            </TableHead>
            <TableHead>Business</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Website</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Status</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id} className={selectedSet.has(lead.id) ? "bg-cyan-950/20" : ""}>
              <TableCell>
                <input
                  type="checkbox"
                  aria-label={`Select ${lead.businessName}`}
                  checked={selectedSet.has(lead.id)}
                  onChange={() => toggleLeadSelection(lead.id)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950"
                />
              </TableCell>
              <TableCell>
                <div className="font-medium">{lead.businessName}</div>
                <div className="text-xs text-slate-500">{lead.city}</div>
              </TableCell>
              <TableCell>{lead.email ?? lead.whatsapp ?? lead.phone ?? "No contact"}</TableCell>
              <TableCell>
                <WebsiteStatusBadge status={lead.websiteStatus} />
              </TableCell>
              <TableCell>{lead.leadScore}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <TemperatureBadge temperature={lead.temperature} />
                  <span className="text-xs text-slate-400">{lead.commercialStatus}</span>
                </div>
              </TableCell>
              <TableCell>
                <Button size="sm" variant="secondary" asChild>
                  <Link href={`/leads/${lead.id}`}>View</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BulkOutreachPanel } from "./bulk-outreach-panel";
import type { BulkOutreachItemView } from "./bulk-outreach-item-editor";

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

export function LeadWhatsappOutreachPanel({ leadId }: { leadId: string }) {
  const [batch, setBatch] = useState<CreatedBatch | undefined>();
  const [items, setItems] = useState<BulkOutreachItemView[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [creating, setCreating] = useState(false);
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

  async function createBatch() {
    setCreating(true);
    setError(undefined);
    setBatch(undefined);
    setItems([]);
    setDeliveryResults([]);
    setChannelReadiness(undefined);
    try {
      const response = await fetch("/api/freelance/bulk-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "whatsapp", leadIds: [leadId], stage: "first_contact" })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to create WhatsApp outreach.");
      }
      setBatch(payload.batch);
      setItems(payload.items ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create WhatsApp outreach.");
    } finally {
      setCreating(false);
    }
  }

  async function generateDrafts() {
    if (!batch) return;
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
        throw new Error(payload.error ?? "Unable to generate WhatsApp draft.");
      }
      setBatch(payload.batch);
      setItems(payload.items ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to generate WhatsApp draft.");
    } finally {
      setGenerating(false);
    }
  }

  async function saveItem(itemId: string, payload: Record<string, unknown>) {
    if (!batch) return;
    const response = await fetch(`/api/freelance/bulk-outreach/${batch.id}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const responsePayload = await response.json();
    if (!response.ok) {
      throw new Error(responsePayload.error ?? "Unable to save WhatsApp item.");
    }
    setBatch(responsePayload.batch);
    setItems((current) => current.map((item) => (item.id === responsePayload.item.id ? responsePayload.item : item)));
  }

  async function approveDelivery() {
    if (!batch) return;
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
          providerName: payload.providerName ?? "whatsapp",
          missingEnvVars: payload.missingEnvVars ?? [],
          diagnosticMessage: payload.diagnosticMessage ?? payload.error
        });
        throw new Error(payload.diagnosticMessage ?? payload.error ?? "Unable to approve WhatsApp delivery.");
      }
      setBatch(payload.batch);
      setDeliveryResults(payload.results ?? []);
      setChannelReadiness(payload.channelReadiness);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to approve WhatsApp delivery.");
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button type="button" size="sm" onClick={createBatch} disabled={creating}>
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        {creating ? "Creating..." : "Review/send WhatsApp"}
      </Button>
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
    </div>
  );
}

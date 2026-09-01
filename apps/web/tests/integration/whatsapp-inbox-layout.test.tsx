import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WhatsAppInbox } from "@/components/whatsapp/whatsapp-inbox";

const conversations = [
  {
    id: "conversation-1",
    leadId: "lead-1",
    businessName: "Clínica com um nome propositalmente muito longo para validar o corte",
    contactPhone: "+5511999999999",
    contactName: "Clínica",
    status: "open",
    lastMessagePreview:
      "Esta é uma prévia longa que precisa permanecer contida dentro da lista de conversas.",
    lastMessageDirection: "inbound" as const,
    lastMessageAt: "2026-08-28T12:00:00.000Z",
    unreadInboundCount: 3
  }
];

describe("WhatsApp inbox layout", () => {
  it("places a prominent unread indicator before truncated conversation content", () => {
    vi.stubGlobal("fetch", vi.fn());
    render(
      <WhatsAppInbox
        initialConversations={conversations}
        initialMessages={[]}
        initialSelectedId={null}
      />
    );

    const unreadIndicator = screen.getByLabelText("3 mensagens não lidas");
    const businessName = screen.getByText(conversations[0].businessName);

    expect(
      unreadIndicator.compareDocumentPosition(businessName) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(businessName).toHaveClass("truncate", "min-w-0");
  });

  it("exposes a keyboard-resizable separator", () => {
    vi.stubGlobal("fetch", vi.fn());
    render(
      <WhatsAppInbox
        initialConversations={conversations}
        initialMessages={[]}
        initialSelectedId="conversation-1"
      />
    );

    const separator = screen.getByRole("separator", {
      name: "Redimensionar lista de conversas"
    });
    expect(separator).toHaveAttribute("aria-valuenow", "360");

    fireEvent.keyDown(separator, { key: "ArrowRight" });
    expect(separator).toHaveAttribute("aria-valuenow", "376");

    fireEvent.keyDown(separator, { key: "Home" });
    expect(separator).toHaveAttribute("aria-valuenow", "280");
  });
});

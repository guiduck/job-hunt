import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SellerSettingsForm } from "@/components/settings/seller-settings-form";

describe("seller settings generation context", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("saves offer context used by batch generation", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "settings_1" }), { status: 200 })
    );
    render(
      <SellerSettingsForm
        settings={null}
        niches={[]}
        channelSettings={[
          {
            channel: "email",
            providerName: "resend",
            status: "ready",
            enabled: true,
            dailyLimit: 500,
            remainingToday: 500,
            requiredEnvVars: [],
            missingEnvVars: []
          }
        ]}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Portfolio URL"), {
      target: { value: "www.gfig.space" }
    });
    fireEvent.change(screen.getByPlaceholderText(/Base landing page price BRL/i), {
      target: { value: "2500" }
    });
    fireEvent.change(screen.getByPlaceholderText(/Base landing page price USD/i), {
      target: { value: "1000" }
    });
    fireEvent.change(screen.getByPlaceholderText(/Offer title/i), {
      target: { value: "Landing page sprint" }
    });
    fireEvent.change(screen.getByPlaceholderText(/AI context/i), {
      target: { value: "Use concise Portuguese and mention portfolio proof." }
    });
    fireEvent.submit(screen.getByRole("button", { name: "Save settings" }).closest("form")!);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(String(fetchMock.mock.calls[0][1]?.body)).toContain("Landing page sprint");
    expect(String(fetchMock.mock.calls[0][1]?.body)).toContain("https://www.gfig.space");
    expect(String(fetchMock.mock.calls[0][1]?.body)).toContain("2500");
    expect(String(fetchMock.mock.calls[0][1]?.body)).toContain("1000");
    expect(String(fetchMock.mock.calls[0][1]?.body)).toContain("portfolio proof");
    expect(screen.getByText("Outreach channel readiness")).toBeInTheDocument();
  });
});

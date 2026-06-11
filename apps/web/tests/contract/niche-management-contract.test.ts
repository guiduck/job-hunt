import { beforeEach, describe, expect, it, vi } from "vitest";

const createNicheMock = vi.fn();
const updateNicheMock = vi.fn();

vi.mock("@/lib/freelance/niche-service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/freelance/niche-service")>(
    "@/lib/freelance/niche-service"
  );
  return {
    ...actual,
    createNiche: createNicheMock,
    updateNiche: updateNicheMock
  };
});

vi.mock("@/lib/freelance/campaign-service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/freelance/campaign-service")>(
    "@/lib/freelance/campaign-service"
  );
  return {
    ...actual,
    serializeNiche: (item: Record<string, unknown>) => item
  };
});

const { POST } = await import("@/app/api/freelance/niches/route");
const { PATCH } = await import("@/app/api/freelance/niches/[nicheId]/route");
const { NicheServiceError } = await import("@/lib/freelance/niche-service");

describe("niche management API contract", () => {
  beforeEach(() => {
    createNicheMock.mockReset();
    updateNicheMock.mockReset();
  });

  it("creates an approved niche with status 201", async () => {
    createNicheMock.mockResolvedValue({
      id: "niche-new",
      displayName: "Solar Installer",
      slug: "solar-installer"
    });

    const response = await POST(
      new Request("http://localhost/api/freelance/niches", {
        method: "POST",
        body: JSON.stringify({ displayName: "Solar Installer" })
      })
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      id: "niche-new",
      slug: "solar-installer"
    });
  });

  it("returns 409 for duplicate slug or alias conflicts", async () => {
    createNicheMock.mockRejectedValue(
      new NicheServiceError("An approved niche already uses this slug or alias.", 409)
    );

    const response = await POST(
      new Request("http://localhost/api/freelance/niches", {
        method: "POST",
        body: JSON.stringify({ displayName: "Dentist" })
      })
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "An approved niche already uses this slug or alias."
    });
  });

  it("updates lifecycle fields through the niche detail route", async () => {
    updateNicheMock.mockResolvedValue({
      id: "niche-1",
      displayName: "Dentist",
      enabled: false,
      lifecycleStatus: "disabled"
    });

    const response = await PATCH(
      new Request("http://localhost/api/freelance/niches/niche-1", {
        method: "PATCH",
        body: JSON.stringify({ lifecycleStatus: "disabled", enabled: false })
      }),
      { params: Promise.resolve({ nicheId: "niche-1" }) }
    );

    expect(response.status).toBe(200);
    expect(updateNicheMock).toHaveBeenCalledWith("niche-1", {
      lifecycleStatus: "disabled",
      enabled: false
    });
    expect(await response.json()).toMatchObject({
      enabled: false,
      lifecycleStatus: "disabled"
    });
  });
});

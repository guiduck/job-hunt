import { afterEach, describe, expect, it, vi } from "vitest";
import {
  listLocalityCities,
  listLocalityStates,
  lookupBrazilianPostalCode
} from "@/lib/freelance/locality-service";

function mockJsonResponse(data: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data)
  } as Response);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("locality service", () => {
  it("maps IBGE states and cities for BR autocomplete", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementationOnce(() =>
        mockJsonResponse([
          { id: 42, sigla: "SC", nome: "Santa Catarina" },
          { id: 35, sigla: "SP", nome: "Sao Paulo" }
        ])
      )
      .mockImplementationOnce(() =>
        mockJsonResponse([
          { id: 4207502, nome: "Indaial" },
          { id: 4202404, nome: "Blumenau" }
        ])
      );

    await expect(listLocalityStates("BR", "santa")).resolves.toEqual([
      { value: "SC", label: "Santa Catarina", meta: "SC" }
    ]);
    await expect(listLocalityCities("BR", "SC", "inda")).resolves.toEqual([
      { value: "Indaial", label: "Indaial", meta: "SC" }
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("maps US Census places for international city autocomplete", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      mockJsonResponse([
        ["NAME", "state", "place"],
        ["Orlando city, Florida", "12", "53000"],
        ["Orlovista CDP, Florida", "12", "53275"]
      ])
    );

    await expect(listLocalityCities("INTERNATIONAL", "FL", "orlan")).resolves.toEqual([
      { value: "Orlando", label: "Orlando", meta: "FL 53000" }
    ]);
  });

  it("falls back to bundled US cities when the external provider is unavailable", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("network unavailable"));

    await expect(listLocalityCities("INTERNATIONAL", "FL", "orlan")).resolves.toEqual([
      { value: "Orlando", label: "Orlando", meta: "FL fallback" }
    ]);
  });

  it("looks up Brazilian CEP data through ViaCEP", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      mockJsonResponse({
        cep: "89010-000",
        uf: "SC",
        localidade: "Blumenau",
        bairro: "Centro",
        logradouro: "Rua XV de Novembro"
      })
    );

    await expect(lookupBrazilianPostalCode("89010-000")).resolves.toEqual({
      postalCode: "89010-000",
      state: "SC",
      city: "Blumenau",
      region: "Centro",
      street: "Rua XV de Novembro"
    });
  });
});

"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { NicheDto } from "@/lib/freelance/campaign-service";
import { Button } from "@/components/ui/button";
import { Autocomplete, type AutocompleteOption } from "@/components/ui/autocomplete";
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

type PostalCodeLookup = {
  state: string;
  city: string;
  region?: string;
};

async function fetchOptions(path: string) {
  const response = await fetch(path);
  if (!response.ok) {
    return [];
  }
  const body = (await response.json()) as { items?: AutocompleteOption[] };
  return body.items ?? [];
}

export function CampaignFormDialog({ niches }: { niches: NicheDto[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [marketScope, setMarketScope] = useState<"BR" | "INTERNATIONAL">("BR");
  const [country, setCountry] = useState("Brasil");
  const [stateValue, setStateValue] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [stateQuery, setStateQuery] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [stateOptions, setStateOptions] = useState<AutocompleteOption[]>([]);
  const [cityOptions, setCityOptions] = useState<AutocompleteOption[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLookingUpPostalCode, setIsLookingUpPostalCode] = useState(false);
  const [nicheId, setNicheId] = useState(
    niches.find((niche) => niche.enabled && niche.lifecycleStatus === "approved")?.id ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedNiche = useMemo(
    () => niches.find((niche) => niche.id === nicheId),
    [nicheId, niches]
  );

  useEffect(() => {
    let ignore = false;
    setIsLoadingStates(true);
    const searchParams = new URLSearchParams({ marketScope, q: stateQuery });
    fetchOptions(`/api/freelance/localities/states?${searchParams.toString()}`)
      .then((items) => {
        if (!ignore) {
          setStateOptions(items);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoadingStates(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [marketScope, stateQuery]);

  useEffect(() => {
    if (!stateValue.trim()) {
      setCityOptions([]);
      return;
    }

    let ignore = false;
    setIsLoadingCities(true);
    const searchParams = new URLSearchParams({
      marketScope,
      state: stateValue,
      q: cityQuery
    });
    fetchOptions(`/api/freelance/localities/cities?${searchParams.toString()}`)
      .then((items) => {
        if (!ignore) {
          setCityOptions(items);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoadingCities(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [cityQuery, marketScope, stateValue]);

  function onMarketChange(nextMarket: "BR" | "INTERNATIONAL") {
    setMarketScope(nextMarket);
    setCountry(nextMarket === "BR" ? "Brasil" : "United States");
    setStateValue("");
    setCity("");
    setRegion("");
    setPostalCode("");
    setStateQuery("");
    setCityQuery("");
  }

  async function lookupPostalCode() {
    if (marketScope !== "BR" || postalCode.replace(/\D/g, "").length !== 8) {
      return;
    }

    setIsLookingUpPostalCode(true);
    setError(null);
    const response = await fetch(
      `/api/freelance/localities/postal-code?postalCode=${encodeURIComponent(postalCode)}`
    );
    setIsLookingUpPostalCode(false);

    if (!response.ok) {
      setError("CEP not found.");
      return;
    }

    const item = (await response.json()) as PostalCodeLookup;
    setStateValue(item.state);
    setStateQuery(item.state);
    setCity(item.city);
    setCityQuery(item.city);
    setRegion(item.region ?? "");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") || ""),
      marketScope,
      country,
      region,
      state: stateValue,
      city,
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
                  onMarketChange(event.target.value as "BR" | "INTERNATIONAL")
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
                  .filter((niche) => niche.enabled && niche.lifecycleStatus === "approved")
                  .map((niche) => (
                    <option key={niche.id} value={niche.id}>
                      {niche.displayName}
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
                value={country}
                onChange={(event) => setCountry(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-xs text-slate-400">
              {marketScope === "BR" ? "State" : "State / region"}
              <Autocomplete
                name="state"
                value={stateValue}
                options={stateOptions}
                placeholder={marketScope === "BR" ? "SC" : "TX"}
                isLoading={isLoadingStates}
                emptyLabel="No states found"
                onValueChange={(value) => {
                  setStateValue(value);
                  setCity("");
                  setCityQuery("");
                }}
                onQueryChange={setStateQuery}
                onSelect={(option) => {
                  setStateQuery(option.label);
                  setCity("");
                  setCityQuery("");
                }}
              />
            </label>
          </div>

          {marketScope === "BR" ? (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="space-y-1 text-xs text-slate-400">
                CEP
                <Input
                  value={postalCode}
                  inputMode="numeric"
                  placeholder="89000-000"
                  onChange={(event) => setPostalCode(event.target.value)}
                />
              </label>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={lookupPostalCode}
                  disabled={isLookingUpPostalCode || postalCode.replace(/\D/g, "").length !== 8}
                >
                  {isLookingUpPostalCode ? "Looking..." : "Use CEP"}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-xs text-slate-400">
              Region
              <Input
                name="region"
                value={region}
                placeholder="Optional"
                onChange={(event) => setRegion(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-xs text-slate-400">
              City
              <Autocomplete
                name="city"
                value={city}
                required
                disabled={!stateValue.trim()}
                options={cityOptions}
                placeholder={marketScope === "BR" ? "Indaial" : "Orlando"}
                isLoading={isLoadingCities}
                emptyLabel={stateValue.trim() ? "No cities found" : "Choose a state first"}
                onValueChange={setCity}
                onQueryChange={setCityQuery}
                onSelect={(option) => setCityQuery(option.label)}
              />
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

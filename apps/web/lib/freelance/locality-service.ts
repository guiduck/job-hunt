export type LocalityMarketScope = "BR" | "INTERNATIONAL";

export type LocalityOption = {
  value: string;
  label: string;
  meta?: string;
};

export type PostalCodeLookup = {
  postalCode: string;
  state: string;
  city: string;
  region?: string;
  street?: string;
};

type IbgeState = {
  id: number;
  sigla: string;
  nome: string;
};

type IbgeCity = {
  id: number;
  nome: string;
};

type ViaCepAddress = {
  cep?: string;
  uf?: string;
  localidade?: string;
  bairro?: string;
  logradouro?: string;
  erro?: boolean;
};

const US_STATES: Array<LocalityOption & { fips: string }> = [
  { value: "AL", label: "Alabama", fips: "01" },
  { value: "AK", label: "Alaska", fips: "02" },
  { value: "AZ", label: "Arizona", fips: "04" },
  { value: "AR", label: "Arkansas", fips: "05" },
  { value: "CA", label: "California", fips: "06" },
  { value: "CO", label: "Colorado", fips: "08" },
  { value: "CT", label: "Connecticut", fips: "09" },
  { value: "DE", label: "Delaware", fips: "10" },
  { value: "DC", label: "District of Columbia", fips: "11" },
  { value: "FL", label: "Florida", fips: "12" },
  { value: "GA", label: "Georgia", fips: "13" },
  { value: "HI", label: "Hawaii", fips: "15" },
  { value: "ID", label: "Idaho", fips: "16" },
  { value: "IL", label: "Illinois", fips: "17" },
  { value: "IN", label: "Indiana", fips: "18" },
  { value: "IA", label: "Iowa", fips: "19" },
  { value: "KS", label: "Kansas", fips: "20" },
  { value: "KY", label: "Kentucky", fips: "21" },
  { value: "LA", label: "Louisiana", fips: "22" },
  { value: "ME", label: "Maine", fips: "23" },
  { value: "MD", label: "Maryland", fips: "24" },
  { value: "MA", label: "Massachusetts", fips: "25" },
  { value: "MI", label: "Michigan", fips: "26" },
  { value: "MN", label: "Minnesota", fips: "27" },
  { value: "MS", label: "Mississippi", fips: "28" },
  { value: "MO", label: "Missouri", fips: "29" },
  { value: "MT", label: "Montana", fips: "30" },
  { value: "NE", label: "Nebraska", fips: "31" },
  { value: "NV", label: "Nevada", fips: "32" },
  { value: "NH", label: "New Hampshire", fips: "33" },
  { value: "NJ", label: "New Jersey", fips: "34" },
  { value: "NM", label: "New Mexico", fips: "35" },
  { value: "NY", label: "New York", fips: "36" },
  { value: "NC", label: "North Carolina", fips: "37" },
  { value: "ND", label: "North Dakota", fips: "38" },
  { value: "OH", label: "Ohio", fips: "39" },
  { value: "OK", label: "Oklahoma", fips: "40" },
  { value: "OR", label: "Oregon", fips: "41" },
  { value: "PA", label: "Pennsylvania", fips: "42" },
  { value: "RI", label: "Rhode Island", fips: "44" },
  { value: "SC", label: "South Carolina", fips: "45" },
  { value: "SD", label: "South Dakota", fips: "46" },
  { value: "TN", label: "Tennessee", fips: "47" },
  { value: "TX", label: "Texas", fips: "48" },
  { value: "UT", label: "Utah", fips: "49" },
  { value: "VT", label: "Vermont", fips: "50" },
  { value: "VA", label: "Virginia", fips: "51" },
  { value: "WA", label: "Washington", fips: "53" },
  { value: "WV", label: "West Virginia", fips: "54" },
  { value: "WI", label: "Wisconsin", fips: "55" },
  { value: "WY", label: "Wyoming", fips: "56" }
];

const US_CITY_FALLBACKS: Record<string, string[]> = {
  CA: ["Los Angeles", "San Diego", "San Jose", "San Francisco", "Sacramento", "Fresno", "Oakland"],
  FL: ["Jacksonville", "Miami", "Tampa", "Orlando", "St. Petersburg", "Hialeah", "Tallahassee"],
  GA: ["Atlanta", "Augusta", "Columbus", "Savannah", "Athens", "Sandy Springs"],
  IL: ["Chicago", "Aurora", "Naperville", "Joliet", "Rockford", "Springfield"],
  MA: ["Boston", "Worcester", "Springfield", "Cambridge", "Lowell"],
  NC: ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem"],
  NJ: ["Newark", "Jersey City", "Paterson", "Elizabeth", "Edison"],
  NY: ["New York", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany"],
  OH: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton"],
  PA: ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading"],
  TX: ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso", "Plano"],
  VA: ["Virginia Beach", "Chesapeake", "Norfolk", "Richmond", "Arlington", "Alexandria"],
  WA: ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue"]
};

function matchesQuery(option: LocalityOption, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return `${option.value} ${option.label} ${option.meta ?? ""}`.toLowerCase().includes(normalized);
}

function stripCensusPlaceSuffix(name: string) {
  return name
    .replace(/,\s+[A-Za-z .'-]+$/, "")
    .replace(/\s+(city|town|village|borough|municipality|CDP)$/i, "")
    .trim();
}

function fallbackUsCities(stateCode: string, query: string) {
  return (US_CITY_FALLBACKS[stateCode] ?? [])
    .map((city) => ({ value: city, label: city, meta: `${stateCode} fallback` }))
    .filter((city) => matchesQuery(city, query));
}

export async function listLocalityStates(marketScope: LocalityMarketScope, query = "") {
  if (marketScope === "BR") {
    const response = await fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome",
      { next: { revalidate: 60 * 60 * 24 * 7 } }
    );
    if (!response.ok) {
      throw new Error("Unable to load Brazilian states.");
    }
    const states = (await response.json()) as IbgeState[];
    return states
      .map((state) => ({ value: state.sigla, label: state.nome, meta: state.sigla }))
      .filter((state) => matchesQuery(state, query));
  }

  return US_STATES.filter((state) => matchesQuery(state, query)).map(({ fips: _fips, ...state }) => state);
}

export async function listLocalityCities(
  marketScope: LocalityMarketScope,
  stateCode: string,
  query = ""
) {
  const normalizedState = stateCode.trim().toUpperCase();
  if (!normalizedState) {
    return [];
  }

  if (marketScope === "BR") {
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${encodeURIComponent(normalizedState)}/municipios?orderBy=nome`,
      { next: { revalidate: 60 * 60 * 24 * 7 } }
    );
    if (!response.ok) {
      throw new Error("Unable to load Brazilian cities.");
    }
    const cities = (await response.json()) as IbgeCity[];
    return cities
      .map((city) => ({ value: city.nome, label: city.nome, meta: normalizedState }))
      .filter((city) => matchesQuery(city, query))
      .slice(0, 100);
  }

  const state = US_STATES.find((item) => item.value === normalizedState);
  if (!state) {
    return [];
  }

  const url = new URL("https://api.census.gov/data/2023/acs/acs5");
  url.searchParams.set("get", "NAME");
  url.searchParams.set("for", "place:*");
  url.searchParams.set("in", `state:${state.fips}`);

  try {
    const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 * 7 } });
    if (!response.ok) {
      return fallbackUsCities(state.value, query);
    }

    const rows = (await response.json()) as string[][];
    return rows
      .slice(1)
      .map(([name, _stateFips, placeFips]) => {
        const cityName = stripCensusPlaceSuffix(name ?? "");
        return {
          value: cityName,
          label: cityName,
          meta: `${state.value} ${placeFips ?? ""}`.trim()
        };
      })
      .filter((city) => city.value && matchesQuery(city, query))
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(0, 100);
  } catch {
    return fallbackUsCities(state.value, query);
  }
}

export async function lookupBrazilianPostalCode(postalCode: string): Promise<PostalCodeLookup | null> {
  const digits = postalCode.replace(/\D/g, "");
  if (digits.length !== 8) {
    return null;
  }

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
    next: { revalidate: 60 * 60 * 24 * 30 }
  });
  if (!response.ok) {
    throw new Error("Unable to load CEP data.");
  }

  const address = (await response.json()) as ViaCepAddress;
  if (address.erro || !address.uf || !address.localidade) {
    return null;
  }

  return {
    postalCode: address.cep ?? digits,
    state: address.uf,
    city: address.localidade,
    region: address.bairro || undefined,
    street: address.logradouro || undefined
  };
}

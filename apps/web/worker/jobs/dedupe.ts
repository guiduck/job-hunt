import type { NormalizedBusinessCandidate } from "@/lib/providers/freelance-maps-provider";

export type DedupeOutcome =
  | { duplicate: false; key: string }
  | { duplicate: true; key: string; reason: string };

function normalize(value?: string) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/https?:\/\//, "")
    .replace(/www\./, "")
    .replace(/[^a-z0-9]+/g, "");
}

export type ExistingLeadDedupeInput = {
  businessName: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  websiteUrl?: string | null;
  socialUrl?: string | null;
  sourceIdentifier?: string | null;
};

export function candidateDedupeKey(candidate: NormalizedBusinessCandidate) {
  if (candidate.sourceIdentifier) {
    return `source:${normalize(candidate.sourceIdentifier)}`;
  }
  if (candidate.websiteUrl) {
    return `website:${normalize(candidate.websiteUrl)}`;
  }
  if (candidate.phone) {
    return `phone:${normalize(candidate.phone)}:${normalize(candidate.city)}`;
  }
  return `name:${normalize(candidate.businessName)}:${normalize(candidate.city)}:${normalize(candidate.address)}`;
}

export function existingLeadDedupeKeys(lead: ExistingLeadDedupeInput) {
  return [
    lead.sourceIdentifier ? `source:${normalize(lead.sourceIdentifier)}` : null,
    lead.websiteUrl ? `website:${normalize(lead.websiteUrl)}` : null,
    lead.socialUrl ? `website:${normalize(lead.socialUrl)}` : null,
    lead.phone ? `phone:${normalize(lead.phone)}:${normalize(lead.city ?? undefined)}` : null,
    `name:${normalize(lead.businessName)}:${normalize(lead.city ?? undefined)}:${normalize(
      lead.address ?? undefined
    )}`
  ].filter((key): key is string => Boolean(key));
}

export function checkDuplicate(
  candidate: NormalizedBusinessCandidate,
  seenKeys: Set<string>
): DedupeOutcome {
  const key = candidateDedupeKey(candidate);
  if (seenKeys.has(key)) {
    return { duplicate: true, key, reason: "same_candidate_key" };
  }
  seenKeys.add(key);
  return { duplicate: false, key };
}

const SOCIAL_HOST_PATTERNS = [
  "instagram.com",
  "facebook.com",
  "fb.com",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "x.com",
  "twitter.com",
  "threads.net",
  "linkedin.com"
];

export function isSocialProfileUrl(url?: string | null): boolean {
  if (!url) {
    return false;
  }

  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    return SOCIAL_HOST_PATTERNS.some(
      (pattern) => hostname === pattern || hostname.endsWith(`.${pattern}`)
    );
  } catch {
    return false;
  }
}

export function getOwnedWebsiteUrl(url?: string | null): string | undefined {
  if (!url || isSocialProfileUrl(url)) {
    return undefined;
  }
  return url;
}

export function getSocialProfileUrl(url?: string | null): string | undefined {
  return isSocialProfileUrl(url) ? url ?? undefined : undefined;
}

export function buildGoogleMapsSearchUrl(parts: Array<string | null | undefined>): string {
  const query = parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(" ");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function normalizeOutreachPhone(value?: string | null, country?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const withoutWhatsappPrefix = trimmed.replace(/^whatsapp:/i, "").trim();
  let digits = withoutWhatsappPrefix.replace(/\D/g, "");
  if (!digits) return null;

  const normalizedCountry = country?.trim().toLowerCase();
  const isBrazil =
    digits.startsWith("55") ||
    normalizedCountry === "br" ||
    normalizedCountry === "brazil" ||
    normalizedCountry === "brasil";

  if (isBrazil && !digits.startsWith("55") && (digits.length === 10 || digits.length === 11)) {
    digits = `55${digits}`;
  }

  // Brazilian mobile numbers captured with eight local digits need the mandatory ninth digit.
  // Landlines start with 2-5 and remain unchanged.
  if (digits.startsWith("55") && digits.length === 12 && /^[6-9]/.test(digits.slice(4, 5))) {
    digits = `${digits.slice(0, 4)}9${digits.slice(4)}`;
  }

  if (isBrazil) {
    return /^55[1-9]\d(?:[2-5]\d{7}|9\d{8})$/.test(digits) ? `+${digits}` : null;
  }

  return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
}

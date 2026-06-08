import type { WebsiteAnalysisInput, WebsiteAnalysisResult } from "./types";

export async function analyzeWebsite(
  input: WebsiteAnalysisInput
): Promise<WebsiteAnalysisResult> {
  if (!input.websiteUrl) {
    return {
      requestedUrl: "",
      reachable: false,
      httpsEnabled: false,
      redirected: false,
      detectedStatus: "no_site",
      headings: [],
      ctaTexts: [],
      phoneSignals: [],
      whatsappSignals: [],
      emailSignals: [],
      evidencePoints: ["No website URL was available for this lead."]
    };
  }

  return {
    requestedUrl: input.websiteUrl,
    finalUrl: input.websiteUrl,
    reachable: false,
    httpsEnabled: input.websiteUrl.startsWith("https://"),
    redirected: false,
    detectedStatus: "uncertain",
    headings: [],
    ctaTexts: [],
    phoneSignals: [],
    whatsappSignals: [],
    emailSignals: [],
    evidencePoints: ["Website analysis shell created; fetch/classification runs in US2."]
  };
}

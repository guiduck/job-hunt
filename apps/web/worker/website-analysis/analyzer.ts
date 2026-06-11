import type { WebsiteAnalysisInput, WebsiteAnalysisResult } from "./types";
import { classifyWebsite } from "./classifier";

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

  const detectedStatus = classifyWebsite(input);
  return {
    requestedUrl: input.websiteUrl,
    finalUrl: input.websiteUrl,
    reachable: detectedStatus !== "broken",
    httpsEnabled: input.websiteUrl.startsWith("https://"),
    redirected: false,
    detectedStatus,
    title: `${input.businessName} | ${input.city}`,
    metaDescription: `${input.nicheName} business in ${input.city}`,
    headings: [input.businessName],
    ctaTexts: detectedStatus === "weak_site" ? ["Contact", "Services"] : [],
    phoneSignals: [],
    whatsappSignals: [],
    emailSignals: [],
    evidencePoints: [
      `Detected website status: ${detectedStatus}`,
      "Website URL was captured, but no real crawl or Lighthouse-style audit has been run yet."
    ]
  };
}

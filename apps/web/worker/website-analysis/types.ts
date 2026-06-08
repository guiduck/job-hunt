import type { websiteStatuses } from "@/lib/freelance/constants";

export type WebsiteStatus = (typeof websiteStatuses)[number];

export type WebsiteAnalysisInput = {
  leadId?: string;
  websiteUrl?: string;
  businessName: string;
  city: string;
  nicheName: string;
};

export type WebsiteAnalysisResult = {
  requestedUrl: string;
  finalUrl?: string;
  httpStatus?: number;
  reachable: boolean;
  httpsEnabled: boolean;
  redirected: boolean;
  detectedStatus: WebsiteStatus;
  title?: string;
  metaDescription?: string;
  headings: string[];
  ctaTexts: string[];
  phoneSignals: string[];
  whatsappSignals: string[];
  emailSignals: string[];
  evidencePoints: string[];
};

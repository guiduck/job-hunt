import type { WebsiteStatus } from "./types";

export type WebsiteScores = {
  content: number;
  design: number;
  performance: number;
  seo: number;
  overallOpportunity: number;
};

export function scoreWebsite(status: WebsiteStatus): WebsiteScores {
  if (status === "no_site") {
    return { content: 15, design: 10, performance: 30, seo: 10, overallOpportunity: 88 };
  }
  if (status === "social_only" || status === "linktree" || status === "aggregator") {
    return { content: 35, design: 25, performance: 45, seo: 20, overallOpportunity: 82 };
  }
  if (status === "broken") {
    return { content: 10, design: 10, performance: 10, seo: 5, overallOpportunity: 90 };
  }
  if (status === "weak_site") {
    return { content: 55, design: 45, performance: 50, seo: 45, overallOpportunity: 72 };
  }
  if (status === "usable_site") {
    return { content: 75, design: 70, performance: 68, seo: 72, overallOpportunity: 45 };
  }
  return { content: 40, design: 40, performance: 40, seo: 40, overallOpportunity: 60 };
}

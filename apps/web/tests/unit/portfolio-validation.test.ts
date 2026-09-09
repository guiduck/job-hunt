import { describe, expect, it } from "vitest";
import { nichePortfolioUpsertSchema } from "@/lib/validation/portfolio";

describe("niche portfolio validation", () => {
  it("accepts complete demo and GitHub URLs", () => {
    expect(
      nichePortfolioUpsertSchema.parse({
        projectName: "Dental clinic starter",
        repositoryUrl: "https://github.com/example/dental",
        demoUrl: "https://dental.example.com"
      })
    ).toMatchObject({
      projectName: "Dental clinic starter",
      demoUrl: "https://dental.example.com"
    });
  });

  it("rejects non-http links", () => {
    expect(() =>
      nichePortfolioUpsertSchema.parse({ demoUrl: "javascript:alert(1)" })
    ).toThrow();
  });
});

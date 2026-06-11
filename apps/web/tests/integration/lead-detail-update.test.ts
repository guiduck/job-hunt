import { describe, expect, it } from "vitest";
import { leadUpdateSchema } from "@/lib/validation/freelance";

describe("lead detail update integration", () => {
  it("accepts review fields from the lead detail form", () => {
    const update = leadUpdateSchema.parse({
      commercialStatus: "contacted",
      temperature: "hot",
      demoUrl: "https://demo.example",
      operatorNotes: "Asked for follow-up"
    });

    expect(update.commercialStatus).toBe("contacted");
    expect(update.temperature).toBe("hot");
  });
});

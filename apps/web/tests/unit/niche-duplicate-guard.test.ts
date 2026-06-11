import { describe, expect, it } from "vitest";
import { findNicheConflicts } from "@/lib/freelance/niche-service";

const existing = [
  {
    id: "dentist",
    slug: "dentist",
    displayName: "Dentist",
    aliases: ["Dental clinic", "Dentista"],
    enabled: true,
    lifecycleStatus: "approved"
  },
  {
    id: "disabled-salon",
    slug: "salon",
    displayName: "Salon",
    aliases: [],
    enabled: false,
    lifecycleStatus: "disabled"
  }
];

describe("niche duplicate guard", () => {
  it("prevents duplicate active slugs", () => {
    const conflicts = findNicheConflicts({ displayName: "Dentist" }, existing);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]?.id).toBe("dentist");
  });

  it("prevents alias conflicts against approved niches", () => {
    const conflicts = findNicheConflicts({ displayName: "Oral Care", aliases: ["Dentista"] }, existing);
    expect(conflicts.map((item) => item.id)).toEqual(["dentist"]);
  });

  it("ignores disabled entries and the current row during update", () => {
    expect(findNicheConflicts({ displayName: "Salon" }, existing)).toHaveLength(0);
    expect(findNicheConflicts({ displayName: "Dentist" }, existing, { ignoreId: "dentist" })).toHaveLength(0);
  });
});

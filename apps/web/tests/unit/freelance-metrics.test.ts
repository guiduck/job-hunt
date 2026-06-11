import { describe, expect, it } from "vitest";

function calculateContactRate(totalLeads: number, contactedLeads: number) {
  return totalLeads === 0 ? 0 : Math.round((contactedLeads / totalLeads) * 100);
}

describe("freelance metrics", () => {
  it("calculates contact rate without dividing by zero", () => {
    expect(calculateContactRate(0, 0)).toBe(0);
    expect(calculateContactRate(10, 3)).toBe(30);
  });
});

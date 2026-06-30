import { describe, expect, it } from "vitest";
import { useFreelanceUiStore } from "@/lib/freelance/ui-store";

describe("bulk outreach selection store", () => {
  it("toggles individual leads and visible lead groups", () => {
    useFreelanceUiStore.getState().clearLeadSelection();

    useFreelanceUiStore.getState().toggleLeadSelection("lead_1");
    expect(useFreelanceUiStore.getState().selectedLeadIds).toEqual(["lead_1"]);

    useFreelanceUiStore.getState().selectVisibleLeads(["lead_1", "lead_2"]);
    expect(useFreelanceUiStore.getState().selectedLeadIds.sort()).toEqual(["lead_1", "lead_2"]);

    useFreelanceUiStore.getState().selectVisibleLeads(["lead_1", "lead_2"]);
    expect(useFreelanceUiStore.getState().selectedLeadIds).toEqual([]);
  });

  it("can clear hidden selections while preserving visible selections", () => {
    useFreelanceUiStore.getState().setLeadSelection(["lead_1", "lead_2", "lead_hidden"]);
    useFreelanceUiStore.getState().clearHiddenLeadSelection(["lead_1", "lead_2"]);

    expect(useFreelanceUiStore.getState().selectedLeadIds.sort()).toEqual(["lead_1", "lead_2"]);
  });
});

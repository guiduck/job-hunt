"use client";

import { create } from "zustand";

type JobProgress = {
  jobId: string;
  status: string;
  currentStep: string;
};

type FreelanceUiState = {
  activeCampaignId?: string;
  selectedLeadIds: string[];
  leadFilters: Record<string, string>;
  jobProgress?: JobProgress;
  detailPanelOpen: boolean;
  setActiveCampaignId: (campaignId?: string) => void;
  setLeadFilter: (key: string, value: string) => void;
  setLeadSelection: (leadIds: string[]) => void;
  toggleLeadSelection: (leadId: string) => void;
  selectVisibleLeads: (leadIds: string[]) => void;
  clearHiddenLeadSelection: (visibleLeadIds: string[]) => void;
  clearLeadSelection: () => void;
  setJobProgress: (progress?: JobProgress) => void;
  setDetailPanelOpen: (open: boolean) => void;
};

export const useFreelanceUiStore = create<FreelanceUiState>((set) => ({
  selectedLeadIds: [],
  leadFilters: {},
  detailPanelOpen: true,
  setActiveCampaignId: (activeCampaignId) => set({ activeCampaignId }),
  setLeadFilter: (key, value) =>
    set((state) => ({ leadFilters: { ...state.leadFilters, [key]: value } })),
  setLeadSelection: (selectedLeadIds) => set({ selectedLeadIds }),
  toggleLeadSelection: (leadId) =>
    set((state) => ({
      selectedLeadIds: state.selectedLeadIds.includes(leadId)
        ? state.selectedLeadIds.filter((id) => id !== leadId)
        : [...state.selectedLeadIds, leadId]
    })),
  selectVisibleLeads: (leadIds) =>
    set((state) => {
      const next = new Set(state.selectedLeadIds);
      const allVisibleSelected = leadIds.length > 0 && leadIds.every((id) => next.has(id));
      if (allVisibleSelected) {
        leadIds.forEach((id) => next.delete(id));
      } else {
        leadIds.forEach((id) => next.add(id));
      }
      return { selectedLeadIds: Array.from(next) };
    }),
  clearHiddenLeadSelection: (visibleLeadIds) =>
    set((state) => ({
      selectedLeadIds: state.selectedLeadIds.filter((id) => visibleLeadIds.includes(id))
    })),
  clearLeadSelection: () => set({ selectedLeadIds: [] }),
  setJobProgress: (jobProgress) => set({ jobProgress }),
  setDetailPanelOpen: (detailPanelOpen) => set({ detailPanelOpen })
}));

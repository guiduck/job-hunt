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
  toggleLeadSelection: (leadId: string) => void;
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
  toggleLeadSelection: (leadId) =>
    set((state) => ({
      selectedLeadIds: state.selectedLeadIds.includes(leadId)
        ? state.selectedLeadIds.filter((id) => id !== leadId)
        : [...state.selectedLeadIds, leadId]
    })),
  clearLeadSelection: () => set({ selectedLeadIds: [] }),
  setJobProgress: (jobProgress) => set({ jobProgress }),
  setDetailPanelOpen: (detailPanelOpen) => set({ detailPanelOpen })
}));

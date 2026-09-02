// 사용자 후보 상태 (docs/design/domain-model.md §5).
// zustand + persist. ID만 참조한다 — Complex/Region 원본이나 FitResult는 저장하지 않는다.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Candidate, CandidateNotes, RegionInterest } from "@/domain/types";

export interface CandidatesState {
  candidates: Candidate[];
  regionInterests: RegionInterest[];
  hasHydrated: boolean;

  addCandidate: (complexId: string) => void;
  removeCandidate: (complexId: string) => void;
  toggleFavorite: (complexId: string) => void;
  updateNotes: (complexId: string, notes: Partial<CandidateNotes>) => void;
  isCandidate: (complexId: string) => boolean;
  getCandidate: (complexId: string) => Candidate | undefined;

  addRegionInterest: (regionId: string) => void;
  removeRegionInterest: (regionId: string) => void;
  isRegionInterested: (regionId: string) => boolean;

  reset: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useCandidatesStore = create<CandidatesState>()(
  persist(
    (set, get) => ({
      candidates: [],
      regionInterests: [],
      hasHydrated: false,

      addCandidate: (complexId) =>
        set((s) => {
          // 같은 complexId 중복 저장 금지
          if (s.candidates.some((c) => c.complexId === complexId)) return s;
          const candidate: Candidate = {
            complexId,
            favorite: false,
            notes: { pros: [], cons: [] },
            addedAt: new Date().toISOString(),
          };
          return { candidates: [...s.candidates, candidate] };
        }),

      removeCandidate: (complexId) =>
        set((s) => ({
          candidates: s.candidates.filter((c) => c.complexId !== complexId),
        })),

      toggleFavorite: (complexId) =>
        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.complexId === complexId ? { ...c, favorite: !c.favorite } : c,
          ),
        })),

      // 기존 Candidate의 다른 필드(favorite·addedAt)는 보존, notes만 병합
      updateNotes: (complexId, notes) =>
        set((s) => ({
          candidates: s.candidates.map((c) =>
            c.complexId === complexId
              ? { ...c, notes: { ...c.notes, ...notes } }
              : c,
          ),
        })),

      isCandidate: (complexId) =>
        get().candidates.some((c) => c.complexId === complexId),

      getCandidate: (complexId) =>
        get().candidates.find((c) => c.complexId === complexId),

      addRegionInterest: (regionId) =>
        set((s) => {
          if (s.regionInterests.some((r) => r.regionId === regionId)) return s;
          return {
            regionInterests: [
              ...s.regionInterests,
              { regionId, addedAt: new Date().toISOString() },
            ],
          };
        }),

      removeRegionInterest: (regionId) =>
        set((s) => ({
          regionInterests: s.regionInterests.filter(
            (r) => r.regionId !== regionId,
          ),
        })),

      isRegionInterested: (regionId) =>
        get().regionInterests.some((r) => r.regionId === regionId),

      reset: () => set({ candidates: [], regionInterests: [] }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "homefit-candidates",
      version: 1,
      // hasHydrated는 세션 전용이라 저장하지 않는다
      partialize: (s) => ({
        candidates: s.candidates,
        regionInterests: s.regionInterests,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

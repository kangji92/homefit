// 사용자 후보 상태 (docs/design/domain-model.md §5, v2 §4).
// zustand + persist. 참조는 {kind, id}만 저장 — 원본/FitResult는 저장하지 않는다.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Candidate,
  CandidateNotes,
  ListingKind,
  RegionInterest,
} from "@/domain/types";

export interface CandidatesState {
  candidates: Candidate[];
  regionInterests: RegionInterest[];
  hasHydrated: boolean;

  // id + kind(기본 existing)로 대상을 구분한다.
  addCandidate: (id: string, kind?: ListingKind) => void;
  removeCandidate: (id: string, kind?: ListingKind) => void;
  toggleFavorite: (id: string, kind?: ListingKind) => void;
  updateNotes: (id: string, notes: Partial<CandidateNotes>, kind?: ListingKind) => void;
  isCandidate: (id: string, kind?: ListingKind) => boolean;
  getCandidate: (id: string, kind?: ListingKind) => Candidate | undefined;

  addRegionInterest: (regionId: string) => void;
  removeRegionInterest: (regionId: string) => void;
  isRegionInterested: (regionId: string) => boolean;

  reset: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

const sameRef = (c: Candidate, id: string, kind: ListingKind) =>
  c.id === id && c.kind === kind;

/** persist에 저장되는 슬라이스 */
type PersistedCandidates = Pick<
  CandidatesState,
  "candidates" | "regionInterests"
>;

export const useCandidatesStore = create<CandidatesState>()(
  persist(
    (set, get) => ({
      candidates: [],
      regionInterests: [],
      hasHydrated: false,

      addCandidate: (id, kind = "existing") =>
        set((s) => {
          if (s.candidates.some((c) => sameRef(c, id, kind))) return s;
          const candidate: Candidate = {
            kind,
            id,
            favorite: false,
            notes: { pros: [], cons: [] },
            addedAt: new Date().toISOString(),
          };
          return { candidates: [...s.candidates, candidate] };
        }),

      removeCandidate: (id, kind = "existing") =>
        set((s) => ({
          candidates: s.candidates.filter((c) => !sameRef(c, id, kind)),
        })),

      toggleFavorite: (id, kind = "existing") =>
        set((s) => ({
          candidates: s.candidates.map((c) =>
            sameRef(c, id, kind) ? { ...c, favorite: !c.favorite } : c,
          ),
        })),

      // favorite·addedAt는 보존, notes만 병합
      updateNotes: (id, notes, kind = "existing") =>
        set((s) => ({
          candidates: s.candidates.map((c) =>
            sameRef(c, id, kind) ? { ...c, notes: { ...c.notes, ...notes } } : c,
          ),
        })),

      isCandidate: (id, kind = "existing") =>
        get().candidates.some((c) => sameRef(c, id, kind)),

      getCandidate: (id, kind = "existing") =>
        get().candidates.find((c) => sameRef(c, id, kind)),

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
      version: 2,
      // v1({complexId}) → v2({kind:"existing", id}) 마이그레이션.
      // 기존 저장값은 전부 기존 아파트라 변환이 명확하다.
      migrate: (persisted, version) => {
        const state = persisted as {
          candidates?: Array<Record<string, unknown>>;
          regionInterests?: unknown;
        } | null;
        if (state && version < 2 && Array.isArray(state.candidates)) {
          state.candidates = state.candidates.map((c) => {
            if ("id" in c && "kind" in c) return c;
            const { complexId, ...rest } = c;
            return { kind: "existing", id: complexId, ...rest };
          });
        }
        return state as unknown as PersistedCandidates;
      },
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

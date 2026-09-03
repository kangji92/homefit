// 가구 프로필 상태 (자격 판정용, 우리 조건과 분리). zustand + persist.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HouseholdProfile } from "@/domain/types";

// 전부 미입력(undefined) → 자격 판정에서 unknown
export const DEFAULT_PROFILE: HouseholdProfile = {};

export interface HouseholdState {
  profile: HouseholdProfile;
  hasHydrated: boolean;
  setProfile: (patch: Partial<HouseholdProfile>) => void;
  reset: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useHouseholdStore = create<HouseholdState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      hasHydrated: false,
      setProfile: (patch) =>
        set((s) => ({ profile: { ...s.profile, ...patch } })),
      reset: () => set({ profile: DEFAULT_PROFILE }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "homefit-household",
      version: 2,
      // v1({totalAssetManwon}) → v2: 부동산·자동차 분리로 스키마 변경.
      //   기존 자산값은 성격이 모호해 부동산가액으로 이관(최선 추정).
      migrate: (persisted, version) => {
        const state = persisted as { profile?: Record<string, unknown> } | null;
        if (state?.profile && version < 2 && "totalAssetManwon" in state.profile) {
          const { totalAssetManwon, ...rest } = state.profile;
          state.profile = { ...rest, realEstateAssetManwon: totalAssetManwon };
        }
        return state as unknown as { profile: HouseholdProfile };
      },
      partialize: (s) => ({ profile: s.profile }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

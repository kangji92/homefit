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
      version: 1,
      partialize: (s) => ({ profile: s.profile }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

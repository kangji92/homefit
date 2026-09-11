// 현재 주거 맥락 + 지역 선호 전역 상태 (zustand + persist).
// "앞으로 원하는 집"(conditionsStore)·"자격 프로필"(householdStore)과 분리된
// 새 aggregate. 현재 상태(출발점)와 지역 hard/soft 제약을 한곳에 응집.
// (docs/design/current-housing.md §1,§8)

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CurrentHousing, RegionPreferences } from "@/domain/types";

export const DEFAULT_REGION_PREFS: RegionPreferences = { preferred: [], excluded: [] };

export interface LivingContextState {
  /** 현재 주거 — MVP optional. 미입력이면 undefined. */
  current?: CurrentHousing;
  regionPrefs: RegionPreferences;
  /** 온보딩 '현재 상황' 인트로를 지났는지(건너뛰기 포함). */
  onboardingIntroSeen: boolean;
  hasHydrated: boolean;

  setCurrent: (patch: Partial<CurrentHousing>) => void;
  clearCurrent: () => void;
  setRegionPrefs: (patch: Partial<RegionPreferences>) => void;
  setOnboardingIntroSeen: (v: boolean) => void;
  reset: () => void;
  setHasHydrated: (v: boolean) => void;
}

// tenure/movePreference는 필수 필드라 patch 병합 시 기본값을 보장한다.
const DEFAULT_CURRENT: CurrentHousing = { tenure: "jeonse", movePreference: "open_to_move" };

export const useLivingContextStore = create<LivingContextState>()(
  persist(
    (set) => ({
      current: undefined,
      regionPrefs: DEFAULT_REGION_PREFS,
      onboardingIntroSeen: false,
      hasHydrated: false,

      setCurrent: (patch) =>
        set((s) => ({ current: { ...DEFAULT_CURRENT, ...s.current, ...patch } })),
      clearCurrent: () => set({ current: undefined }),
      setRegionPrefs: (patch) =>
        set((s) => ({ regionPrefs: { ...s.regionPrefs, ...patch } })),
      setOnboardingIntroSeen: (onboardingIntroSeen) => set({ onboardingIntroSeen }),
      reset: () =>
        set({ current: undefined, regionPrefs: DEFAULT_REGION_PREFS, onboardingIntroSeen: false }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "homefit-living-context",
      version: 1,
      partialize: (s) => ({
        current: s.current,
        regionPrefs: s.regionPrefs,
        onboardingIntroSeen: s.onboardingIntroSeen,
      }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);

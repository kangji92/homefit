// 사용자가 수기 입력한 실제 매물(현장 확인/직접 입력). 별도 도메인 타입 없이 기존 Home
// 재사용(kind:"existing", housingType:"villa" 등). 로컬 persist. 크롤링/자동수집 아님.
// (docs/design 개발레이어 manual-broker-property)

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Home } from "@/domain/types";

export interface ManualPropertyState {
  properties: Home[];
  hasHydrated: boolean;
  add: (p: Home) => void;
  remove: (id: string) => void;
  reset: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useManualPropertyStore = create<ManualPropertyState>()(
  persist(
    (set) => ({
      properties: [],
      hasHydrated: false,
      add: (p) =>
        set((s) => ({ properties: [...s.properties.filter((x) => x.id !== p.id), p] })),
      remove: (id) => set((s) => ({ properties: s.properties.filter((x) => x.id !== id) })),
      reset: () => set({ properties: [] }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "homefit-manual-properties",
      version: 1,
      partialize: (s) => ({ properties: s.properties }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);

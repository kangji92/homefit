// 우리 조건 전역 상태 (docs/design/onboarding.md §5).
// zustand + persist(localStorage). 파생값(FitResult 등)은 저장하지 않는다.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Dealbreakers, Priorities, UserConditions } from "@/domain/types";

export const DEFAULT_CONDITIONS: UserConditions = {
  maxBudget: 0,
  availableFunds: 0,
  workplaces: [
    { id: "", label: "", lat: 0, lng: 0, transport: "transit" },
    { id: "", label: "", lat: 0, lng: 0, transport: "transit" },
  ],
  maxCommuteMinutes: 45,
  desiredSize: { min: 25, max: 34 },
  childPlan: "undecided",
  moveInTiming: "flexible",
};

export const DEFAULT_PRIORITIES: Priorities = {
  price: 50,
  commute: 50,
  education: 50,
  newness: 50,
  infrastructure: 50,
  environment: 50,
  futurePotential: 50,
};

export interface ConditionsState {
  conditions: UserConditions;
  priorities: Priorities;
  dealbreakers: Dealbreakers;
  /** 온보딩 재개용 (0-index) */
  onboardingStep: number;
  onboardingCompleted: boolean;
  /** localStorage 복원 완료 여부 (persist 안 함) */
  hasHydrated: boolean;

  patchConditions: (patch: Partial<UserConditions>) => void;
  setPriorities: (priorities: Priorities) => void;
  setDealbreakers: (dealbreakers: Dealbreakers) => void;
  setStep: (onboardingStep: number) => void;
  completeOnboarding: () => void;
  reset: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useConditionsStore = create<ConditionsState>()(
  persist(
    (set) => ({
      conditions: DEFAULT_CONDITIONS,
      priorities: DEFAULT_PRIORITIES,
      dealbreakers: {},
      onboardingStep: 0,
      onboardingCompleted: false,
      hasHydrated: false,

      patchConditions: (patch) =>
        set((s) => ({ conditions: { ...s.conditions, ...patch } })),
      setPriorities: (priorities) => set({ priorities }),
      setDealbreakers: (dealbreakers) => set({ dealbreakers }),
      setStep: (onboardingStep) => set({ onboardingStep }),
      completeOnboarding: () => set({ onboardingCompleted: true }),
      reset: () =>
        set({
          conditions: DEFAULT_CONDITIONS,
          priorities: DEFAULT_PRIORITIES,
          dealbreakers: {},
          onboardingStep: 0,
          onboardingCompleted: false,
        }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "homefit-conditions",
      version: 1,
      // hasHydrated는 세션 전용이라 저장하지 않는다
      partialize: (s) => ({
        conditions: s.conditions,
        priorities: s.priorities,
        dealbreakers: s.dealbreakers,
        onboardingStep: s.onboardingStep,
        onboardingCompleted: s.onboardingCompleted,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

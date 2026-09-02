import type { Page } from "@playwright/test";

// 온보딩을 마친 "우리 조건" 상태(persist v2). 후보/비교 플로우의 Arrange용.
// 온보딩 자체는 onboarding.spec.ts에서 UI로 검증한다.
const READY_CONDITIONS = {
  state: {
    conditions: {
      dealType: "sale",
      maxSalePrice: 100000,
      maxJeonseDeposit: 60000,
      availableFunds: 50000,
      workplaces: [
        { id: "gangnam", label: "강남", lat: 0, lng: 0, transport: "transit" },
        { id: "pangyo", label: "판교", lat: 0, lng: 0, transport: "car" },
      ],
      maxCommuteMinutes: 60,
      desiredSize: { min: 25, max: 34 },
      childPlan: "undecided",
      moveInTiming: "flexible",
    },
    priorities: {
      price: 50,
      commute: 50,
      education: 50,
      newness: 50,
      infrastructure: 50,
      environment: 50,
      futurePotential: 50,
    },
    dealbreakers: {},
    onboardingStep: 0,
    onboardingCompleted: true,
  },
  version: 2,
};

/** 앱 로드 전 localStorage에 온보딩 완료 상태를 심는다(매 내비게이션마다 적용). */
export async function seedConditions(page: Page): Promise<void> {
  await page.addInitScript((value) => {
    window.localStorage.setItem("homefit-conditions", value);
  }, JSON.stringify(READY_CONDITIONS));
}

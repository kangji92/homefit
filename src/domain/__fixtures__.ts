// 테스트 공용 픽스처. 기본값은 scoring.md §7 워크드 예시(총점 62)와 일치한다.
// (파일명이 .test/.spec가 아니므로 테스트 러너가 수집하지 않음)

import type { Complex, Priorities, UserConditions } from "./types";

export function makeConditions(
  overrides: Partial<UserConditions> = {},
): UserConditions {
  return {
    dealType: "sale",
    maxSalePrice: 100000,
    maxJeonseDeposit: 60000,
    availableFunds: 50000,
    workplaces: [
      { id: "a", label: "A 직장", lat: 0, lng: 0, transport: "transit" },
      { id: "b", label: "B 직장", lat: 0, lng: 0, transport: "car" },
    ],
    maxCommuteMinutes: 45,
    desiredSize: { min: 25, max: 34 },
    childPlan: "undecided",
    moveInTiming: "flexible",
    ...overrides,
  };
}

export function makeComplex(overrides: Partial<Complex> = {}): Complex {
  return {
    id: "c1",
    name: "테스트 단지",
    regionId: "r1",
    price: { sale: { representative: 80000 }, jeonse: { representative: 50000 } },
    sizesPyeong: [25, 32],
    completionYear: 2018,
    households: 500,
    stationDistanceM: 400,
    commuteMinutes: { a: 30, b: 40 },
    metrics: {
      education: 80,
      infrastructure: 70,
      environment: 65,
      futurePotential: 60,
    },
    schoolNearby: true,
    ...overrides,
  };
}

/** scoring.md §7 예시 우선순위 (합 100) */
export const WORKED_PRIORITIES: Priorities = {
  price: 30,
  commute: 25,
  education: 20,
  newness: 10,
  infrastructure: 5,
  environment: 5,
  futurePotential: 5,
};

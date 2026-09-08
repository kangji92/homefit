import type { Area } from "@/domain/types";

// 개발 예정지(3기신도시) mock. areaMetrics는 0~100 테스트 seed(UI 고지).
// 실데이터는 LH·국토부 개발계획 adapter로 후속 교체.
export const MOCK_AREAS: readonly Area[] = [
  {
    kind: "area",
    id: "area-wangsuk",
    name: "남양주 왕숙",
    regionId: "capital",
    summary: "GTX-B 계획, 대규모 자족 신도시",
    areaMetrics: { plannedInfra: 78, transitPlan: 85, supply: 90, futurePotential: 82, environment: 70 },
    targetMoveInYear: 2031,
  },
  {
    kind: "area",
    id: "area-gyosan",
    name: "하남 교산",
    regionId: "capital",
    summary: "서울 인접, 3호선 연장 추진",
    areaMetrics: { plannedInfra: 74, transitPlan: 80, supply: 68, futurePotential: 84, environment: 82 },
    targetMoveInYear: 2030,
  },
  {
    kind: "area",
    id: "area-gyeyang",
    name: "인천 계양",
    regionId: "capital",
    summary: "상대적 저가, S-BRT 연계",
    areaMetrics: { plannedInfra: 66, transitPlan: 62, supply: 60, futurePotential: 64, environment: 68 },
    targetMoveInYear: 2029,
  },
  {
    kind: "area",
    id: "area-changneung",
    name: "고양 창릉",
    regionId: "capital",
    summary: "GTX-A 인근, 서울 서북부 접근",
    areaMetrics: { plannedInfra: 76, transitPlan: 84, supply: 80, futurePotential: 80, environment: 72 },
    targetMoveInYear: 2031,
  },
  {
    kind: "area",
    id: "area-daejang",
    name: "부천 대장",
    regionId: "capital",
    summary: "S-BRT·자족용지 중심",
    areaMetrics: { plannedInfra: 70, transitPlan: 66, supply: 72, futurePotential: 70, environment: 66 },
    targetMoveInYear: 2030,
  },
];

export function getMockArea(id: string): Area | undefined {
  return MOCK_AREAS.find((a) => a.id === id);
}

import type { Area } from "@/domain/types";

// 개발 예정지(3기신도시·도심재개발) mock. areaMetrics는 0~100 테스트 seed(UI 고지).
// aiInsight는 AI가 공식 발표 팩트에 근거해 생성한 참고 정보(점수 미반영, 라벨 필수).
// 실데이터(지구계획 지표)는 LH·국토부 발표자료 기반으로 후속 보강.
export const MOCK_AREAS: readonly Area[] = [
  {
    kind: "area",
    id: "area-wangsuk",
    name: "남양주 왕숙",
    regionId: "capital",
    summary: "GTX-B 계획, 대규모 자족 신도시",
    areaMetrics: { plannedInfra: 78, transitPlan: 85, supply: 90, futurePotential: 82, environment: 70 },
    targetMoveInYear: 2031,
    aiInsight:
      "3기신도시 최대 규모(약 8만 가구)로 공급이 큰 편이에요. GTX-B 연계로 서울 도심 접근성 개선이 계획돼 있고 자족용지도 넓습니다. 대신 규모가 커 입주까지 시간이 걸릴 수 있어요.",
  },
  {
    kind: "area",
    id: "area-gyosan",
    name: "하남 교산",
    regionId: "capital",
    summary: "서울 인접, 3호선 연장 추진",
    areaMetrics: { plannedInfra: 74, transitPlan: 80, supply: 68, futurePotential: 84, environment: 82 },
    targetMoveInYear: 2030,
    aiInsight:
      "약 3.7만 가구 규모로, 서울 강동·송파에 인접한 위치가 최대 강점이에요. 3호선 연장이 추진 중입니다. 감일지구·감북과 함께 하남 서부 개발축에 있어요. 교통 확정도는 GTX 노선 신도시보다 다소 낮은 편입니다.",
  },
  {
    kind: "area",
    id: "area-gyeyang",
    name: "인천 계양",
    regionId: "capital",
    summary: "상대적 저가, S-BRT 연계",
    areaMetrics: { plannedInfra: 66, transitPlan: 62, supply: 60, futurePotential: 64, environment: 68 },
    targetMoveInYear: 2029,
    aiInsight:
      "약 1.8만 가구로 3기신도시 중 소규모이고 상대적으로 가격 부담이 낮아 실수요에 유리해요. S-BRT·GTX-B 연계와 테크노밸리 자족 계획이 있습니다. 서울 도심까지는 다른 신도시보다 거리가 있는 편이에요.",
  },
  {
    kind: "area",
    id: "area-changneung",
    name: "고양 창릉",
    regionId: "capital",
    summary: "GTX-A 인근, 서울 서북부 접근",
    areaMetrics: { plannedInfra: 76, transitPlan: 84, supply: 80, futurePotential: 80, environment: 72 },
    targetMoveInYear: 2031,
    aiInsight:
      "약 3.8만 가구 규모. GTX-A 연계 시 서울역·삼성역 접근성이 크게 개선될 것으로 계획돼, 3기신도시 중 교통 기대가 큰 편이에요. 서울 서북부(은평·마포) 수요 분산이 목표입니다.",
  },
  {
    kind: "area",
    id: "area-daejang",
    name: "부천 대장",
    regionId: "capital",
    summary: "S-BRT·자족용지 중심",
    areaMetrics: { plannedInfra: 70, transitPlan: 66, supply: 72, futurePotential: 70, environment: 66 },
    targetMoveInYear: 2030,
    aiInsight:
      "약 2만 가구 규모로 자족용지 중심의 신도시예요. S-BRT와 GTX-B 연계로 여의도·서울 방면 접근이 계획돼 있습니다. 인천 계양과 인접한 서부 개발축에 있어요.",
  },
  // 도심 재개발(3기신도시 아님) — 신속통합기획 단계라 분양·입주 수년 후.
  // 공공 API 데이터 없음: areaMetrics·일정 전부 수동 추정(뉴스·정비몽땅 기반).
  {
    kind: "area",
    id: "area-jangwi",
    name: "장위뉴타운(성북)",
    regionId: "capital",
    summary: "성북 도심 재개발 약 5,900세대 · 13구역 신통기획 확정(2026)",
    areaMetrics: { plannedInfra: 74, transitPlan: 64, supply: 78, futurePotential: 82, environment: 60 },
    // 착공·분양 미정 → 입주 예정연도 미상(undefined)
    aiInsight:
      "3기신도시가 아닌 성북 도심 재개발이에요. 13구역 신속통합기획이 2026년 확정돼 총 약 5,900세대 규모로 계획됩니다. 도심이라 기존 생활 인프라가 강점이지만, 사업 초기 단계라 분양·입주는 수년 뒤가 될 전망이에요.",
  },
];

export function getMockArea(id: string): Area | undefined {
  return MOCK_AREAS.find((a) => a.id === id);
}

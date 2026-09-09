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

  // ── 신규 공공택지 (2021~2023 발표) ──────────────────────
  {
    kind: "area",
    id: "area-gwangmyeong-siheung",
    name: "광명시흥",
    regionId: "capital",
    summary: "3기신도시 최대 규모(약 6.7만 가구)·GTX-B/신안산선 연계",
    areaMetrics: { plannedInfra: 80, transitPlan: 82, supply: 95, futurePotential: 86, environment: 68 },
    targetMoveInYear: 2032,
    aiInsight:
      "3기신도시 중 최대 규모(약 6.7만 가구)예요. GTX-B·신안산선·7호선·KTX광명역 등 광역철도 연계로 서울 도심 20분대 진입을 목표로 합니다. 자족도시로 조성되지만 규모가 커 완성까지 시간이 걸려요.",
  },
  {
    kind: "area",
    id: "area-guri-topyeong2",
    name: "구리 토평2",
    regionId: "capital",
    summary: "한강변 신규 택지(약 1.85만 가구)·서울 동부 인접",
    areaMetrics: { plannedInfra: 68, transitPlan: 66, supply: 60, futurePotential: 74, environment: 78 },
    targetMoveInYear: 2030,
    aiInsight:
      "약 1.85만 가구 규모의 한강변 신규 택지(2023 발표)예요. 서울 동부(강동·잠실)에 인접한 위치가 강점입니다. 지구지정 초기 단계라 입주까지는 시간이 걸려요.",
  },
  {
    kind: "area",
    id: "area-osan-segyo3",
    name: "오산 세교3",
    regionId: "capital",
    summary: "반도체 클러스터 중심·KTX/GTX-C 연장 계획(약 3.1만 가구)",
    areaMetrics: { plannedInfra: 66, transitPlan: 72, supply: 76, futurePotential: 74, environment: 66 },
    targetMoveInYear: 2031,
    aiInsight:
      "약 3.1만 가구 규모(2023 발표). 화성·용인·평택 반도체 클러스터 중심부에 있고, KTX·GTX-C 연장 등 철도 계획으로 서울 접근성이 기대돼요.",
  },
  {
    kind: "area",
    id: "area-yongin-idong",
    name: "용인 이동",
    regionId: "capital",
    summary: "용인 반도체 국가산단 배후 주거지(약 1.6만 가구)",
    areaMetrics: { plannedInfra: 64, transitPlan: 58, supply: 60, futurePotential: 80, environment: 66 },
    targetMoveInYear: 2031,
    aiInsight:
      "약 1.6만 가구 규모(2023 발표). 용인 반도체 국가산단 배후 주거지로 계획돼 첨단산업 종사자 수요가 핵심이에요. 서울 도심과는 거리가 있는 편입니다.",
  },

  // ── 1기 신도시 재건축(노후계획도시 특별법 선도지구, 2024 선정) ──
  {
    kind: "area",
    id: "area-bundang-redev",
    name: "분당 재건축(선도지구)",
    regionId: "capital",
    summary: "1기 신도시 재건축 선도지구·신분당선/판교 접근성",
    areaMetrics: { plannedInfra: 88, transitPlan: 82, supply: 55, futurePotential: 88, environment: 80 },
    targetMoveInYear: 2030,
    aiInsight:
      "1기 신도시 재건축 선도지구예요(2024 선정, 2027 착공·2030 입주 목표). 성숙한 생활 인프라와 신분당선·판교 접근성이 강점입니다. 재건축이라 순증 공급은 적고 분담금·이주 등 변수가 있어요.",
  },
  {
    kind: "area",
    id: "area-pyeongchon-redev",
    name: "평촌 재건축(선도지구)",
    regionId: "capital",
    summary: "1기 신도시 재건축 선도지구(3개 구역 약 5,460세대)",
    areaMetrics: { plannedInfra: 84, transitPlan: 74, supply: 52, futurePotential: 82, environment: 76 },
    targetMoveInYear: 2030,
    aiInsight:
      "1기 신도시 재건축 선도지구예요(평촌 3개 구역 약 5,460세대, 2024 선정). 학군·인프라가 성숙한 안양 평촌의 재정비로 2027 착공·2030 입주 목표입니다. 재건축 특성상 순증 공급은 제한적이에요.",
  },
  {
    kind: "area",
    id: "area-sanbon-redev",
    name: "산본 재건축(선도지구)",
    regionId: "capital",
    summary: "1기 신도시 재건축 선도지구(약 4,620세대)·4호선",
    areaMetrics: { plannedInfra: 78, transitPlan: 70, supply: 52, futurePotential: 78, environment: 76 },
    targetMoveInYear: 2030,
    aiInsight:
      "1기 신도시 재건축 선도지구예요(산본 약 4,620세대, 2024 선정). 4호선 산본신도시의 재정비로 2027 착공·2030 입주 목표입니다. 성숙 인프라가 강점이나 재건축 변수(분담금·이주)가 있어요.",
  },
];

export function getMockArea(id: string): Area | undefined {
  return MOCK_AREAS.find((a) => a.id === id);
}

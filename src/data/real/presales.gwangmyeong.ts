// ✅ REAL(공개 확인값) — 광명뉴타운 분양. mock 아님. 큐레이션 2026-09.
// 가격/세대/일정 = 공개 분양 자료(언론/분양 공개). metrics=area-metrics-rubric seed(실측 아님),
// commute=광명 mock 추정(실경로 아님). 좌표는 area 대표점(역/지구 근사).
// 출처: 언론(한경·아시아경제·헤럴드·G밸리타임스) 단지별 공개 페이지.

import type { PresaleHome, SubscriptionConditions } from "@/domain/types";

// 광명 통근 — 7호선(철산)·1호선·신안산선. mock 추정.
const COMMUTE_GWANGMYEONG = { gangnam: 35, pangyo: 50, yeouido: 30, gwanghwamun: 35, jamsil: 45, magok: 30, "guro-gasan": 15 };

// 광명 = 조정대상지역(확인). 전매제한·거주요건 등 적용되나 **정확 개월/연수는 입주자모집공고 확인**
// (임의 추정 금지 → undefined). 규제지역 통상 기준만 표기.
const GM_GENERAL_CONDITIONS: SubscriptionConditions = {
  regulatedArea: "adjustment",
  homelessRequired: true, // 특공·1순위 무주택 세대
  subscriptionAccount: { required: true, minMonths: 24 }, // 규제지역 통상 기준(공고 확인)
  localResidency: { required: true }, // 광명 해당지역 우선(거주기간은 공고 확인)
  rewinLimit: true, // 조정대상지역 재당첨 제한
  note: "조정대상지역 · 전매제한/실거주/거주기간 정확 값은 입주자모집공고 확인",
};

// 철산역자이 (광명뉴타운 12R) — GS건설, 철산동, 2,045세대, 지하7~지상29층 19개동, 입주 2029 상반기.
// 분양가(공개): 59형 12억~ / 84형 15억~(최고 15.76억). 7호선 철산역 도보.
const CHEOLSAN_XI: PresaleHome = {
  kind: "presale",
  id: "presale-gwangmyeong-cheolsan-xi",
  name: "철산역자이 (광명12R)",
  regionId: "gwangmyeong",
  price: { sale: { representative: 150000, min: 120000, max: 157600 } }, // 만원 · 공개 분양가
  sizesPyeong: [17, 20, 25, 30, 34], // 전용 39/49/59/74/84 공급 근사
  moveInYear: 2029,
  households: 2045,
  commuteMinutes: COMMUTE_GWANGMYEONG,
  metrics: { education: 72, infrastructure: 82, environment: 70, futurePotential: 84 }, // rubric seed
  housingType: "apartment",
  location: { lat: 37.4766, lng: 126.8676 }, // 철산역 인근(대표점)
  locationAccuracy: "area",
  // 청약 2025 종료(현재 분양권) → announcementDate 생략(‘다가오는 청약’에 마감으로 뜨지 않게).
  // 조건은 참고용으로 보존.
  subscription: { type: "general", conditions: GM_GENERAL_CONDITIONS },
};

// 광명 시티프라디움 에듀하임 — 시티건설, 구름산지구 A6블록, 426세대, 지하2~지상22층 6개동,
// 전용 59~84㎡, 입주 2029 상반기. **모집공고 2026-09-18, 분양가 미확정(공고 확인)**.
const CITY_PRADIUM_EDUHEIM: PresaleHome = {
  kind: "presale",
  id: "presale-gwangmyeong-city-pradium",
  name: "광명 시티프라디움 에듀하임",
  regionId: "gwangmyeong",
  price: {}, // 분양가 미확정 → 정보 없음(임의 추정 금지)
  sizesPyeong: [25, 34], // 전용 59/84
  moveInYear: 2029,
  households: 426,
  commuteMinutes: COMMUTE_GWANGMYEONG,
  metrics: { education: 74, infrastructure: 74, environment: 74, futurePotential: 78 }, // rubric seed
  housingType: "apartment",
  location: { lat: 37.4235, lng: 126.883 }, // 구름산지구(소하동) 대표점
  locationAccuracy: "area",
  subscription: {
    type: "general",
    announcementDate: "2026-09-18",
    scheduleNote: "견본주택 9/18 개관 · 분양가는 입주자모집공고 확인",
    conditions: GM_GENERAL_CONDITIONS,
  },
};

// 철산자이 더 헤리티지 (철산주공8·9 재건축) — 광명 철산동, 2025-05 준공. **무순위 4세대**.
// 무순위 접수 2026-09-22(당첨발표 9/29). 분양가(공개): 59A 7.17~8.08억(3세대)·59C 7.57억(1세대).
const CHEOLSAN_HERITAGE_UNRANKED: PresaleHome = {
  kind: "presale",
  id: "presale-gwangmyeong-cheolsan-heritage-unranked",
  name: "철산자이 더 헤리티지",
  regionId: "gwangmyeong",
  price: { sale: { representative: 75700, min: 71700, max: 80800 } }, // 만원 · 59A/59C 공개 분양가
  sizesPyeong: [25], // 전용 59
  moveInYear: 2026, // 2025-05 준공, 입주 2026-10~11
  commuteMinutes: COMMUTE_GWANGMYEONG,
  metrics: { education: 74, infrastructure: 82, environment: 70, futurePotential: 82 }, // rubric seed
  housingType: "apartment",
  location: { lat: 37.3914, lng: 126.9228 }, // 철산동(대표점)
  locationAccuracy: "area",
  subscription: {
    type: "unranked",
    announcementDate: "2026-09-22",
    scheduleNote: "무순위 4세대(59A 3·59C 1) · 당첨발표 9/29",
    conditions: {
      regulatedArea: "adjustment",
      homelessRequired: true, // 무순위 = 무주택 세대 대상
      subscriptionAccount: { required: false }, // 무순위는 청약통장 불필요
      localResidency: { required: false }, // 무순위 거주요건 완화
      rewinLimit: false, // 무순위 재당첨 제한 미적용(통상)
      note: "무순위(무주택 세대) · 청약통장 불필요 · 정확 기준 공고 확인",
    },
  },
};

export const REAL_PRESALES_GWANGMYEONG: PresaleHome[] = [
  CHEOLSAN_XI,
  CITY_PRADIUM_EDUHEIM,
  CHEOLSAN_HERITAGE_UNRANKED,
];

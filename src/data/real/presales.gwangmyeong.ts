// ✅ REAL(공개 확인값) — 광명뉴타운 분양. mock 아님. 큐레이션 2026-09.
// 가격/세대/일정 = 공개 분양 자료(언론/분양 공개). metrics=area-metrics-rubric seed(실측 아님),
// commute=광명 mock 추정(실경로 아님). 좌표는 area 대표점(역/지구 근사).
// 출처: 언론(한경·아시아경제·헤럴드·G밸리타임스) 단지별 공개 페이지.

import type { PresaleHome } from "@/domain/types";
import { regulatoryConditions } from "@/domain/eligibility";

// 광명 통근 — 7호선(철산)·1호선·신안산선. mock 추정.
const COMMUTE_GWANGMYEONG = { gangnam: 35, pangyo: 50, yeouido: 30, gwanghwamun: 35, jamsil: 45, magok: 30, "guro-gasan": 15 };

// ⚠️ 광명 = **비규제**(청약홈 공고 2025-11 기준 조정/투기 N) · 수도권 과밀억제권역.
// → 전매 1년·재당첨 미적용·통장 12개월을 법정 룰로 자동 도출. (이전 '조정대상' 표기는 오류 정정.)
const GM_GENERAL_CONDITIONS = {
  ...regulatoryConditions("none", { overcrowdedZone: true }),
  note: "비규제·과밀억제권역(전매 1년) · 실거주/거주기간은 입주자모집공고 확인",
};

// (철산역자이는 청약홈 CSV 실데이터로 대체 — presales.applyhome.ts)

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
      homelessRequired: true, // 무순위 = 무주택 세대 대상(2024+ 강화)
      subscriptionAccount: { required: false }, // 무순위는 청약통장 무관(규정상 안정)
      // ⚠️ 거주요건·재당첨 제한은 시기별 규정 변동이 커 단정 금지 → undefined(공고 확인).
      note: "무순위(무주택 세대) · 청약통장 무관 · 거주요건/재당첨 제한은 입주자모집공고 확인",
    },
  },
};

export const REAL_PRESALES_GWANGMYEONG: PresaleHome[] = [
  CITY_PRADIUM_EDUHEIM,
  CHEOLSAN_HERITAGE_UNRANKED,
];

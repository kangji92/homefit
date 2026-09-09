import type { PresaleHome, Provenance } from "@/domain/types";

// 분양 단지 mock (PresaleHome). 분양가·입주예정·청약일정 + 분양권/전매 상태.
// 일부 필드(households/stationDistanceM)는 미확정(undefined) → dealbreaker unknown 검증.
// 값은 테스트 seed. 실데이터는 청약홈 API로 후속 교체(adapter).

const COMMUTE_GEOMDAN = {
  gangnam: 75, pangyo: 85, yeouido: 55, gwanghwamun: 60,
  jamsil: 80, magok: 40, "guro-gasan": 50,
};
const COMMUTE_DONGTAN = {
  gangnam: 55, pangyo: 45, yeouido: 70, gwanghwamun: 75,
  jamsil: 50, magok: 85, "guro-gasan": 65,
};
const COMMUTE_UIWANG = {
  gangnam: 45, pangyo: 30, yeouido: 50, gwanghwamun: 55,
  jamsil: 50, magok: 60, "guro-gasan": 30,
};

// 공식 공고 근거(mock). 실제는 청약홈 공고 URL·검증일.
const officialSrc = (id: string, verified = true): Provenance => ({
  sourceType: "official_announcement",
  sourceId: id,
  sourceUrl: `https://www.applyhome.co.kr/ai/aia/selectAPTLttotPblancDetail.do?pblancNo=${id}`,
  lastVerifiedAt: "2026-09-01",
  verificationStatus: verified ? "verified" : "needs_review",
});

export const MOCK_PRESALES: readonly PresaleHome[] = [
  // 청약 예정 — 아직 접수 전(planned/scheduled). offering=분양가만.
  {
    kind: "presale",
    id: "presale-geomdan-a",
    name: "검단신도시 어반클래스 (분양)",
    regionId: "geomdan",
    price: { sale: { representative: 58000, min: 54000, max: 63000 } },
    sizesPyeong: [25, 34],
    commuteMinutes: COMMUTE_GEOMDAN,
    metrics: { education: 64, infrastructure: 60, environment: 70, futurePotential: 74 },
    moveInYear: 2028,
    // households·stationDistanceM 미확정 → unknown
    subscription: {
      announcementDate: "2026-10-15",
      scheduleNote: "특별공급 10/20, 1순위 10/21",
    },
    lifecycle: {
      phase: "subscription_scheduled",
      phaseSince: "2026-10-15",
      lastVerifiedAt: "2026-09-01",
      source: officialSrc("2026GEOMDAN-A"),
    },
    offering: {
      basePrice: { manwon: 58000, valueProvenance: "sourced", source: officialSrc("2026GEOMDAN-A") },
    },
  },
  // 전매 가능 — 전매제한 해제·거래 가능(공고 확인). offering=분양가+분양권가(프리미엄).
  {
    kind: "presale",
    id: "presale-dongtan-b",
    name: "동탄2 레이크포레 (분양)",
    regionId: "dongtan",
    price: { sale: { representative: 72000, min: 66000, max: 82000 } },
    sizesPyeong: [34, 44],
    commuteMinutes: COMMUTE_DONGTAN,
    metrics: { education: 78, infrastructure: 72, environment: 82, futurePotential: 76 },
    moveInYear: 2027,
    households: 940,
    stationDistanceM: 650,
    schoolNearby: true,
    subscription: {
      announcementDate: "2025-03-10",
      scheduleNote: "청약 종료",
    },
    lifecycle: {
      phase: "transferable",
      phaseSince: "2026-03-10",
      lastVerifiedAt: "2026-09-01",
      source: officialSrc("2025DONGTAN-B"),
    },
    transfer: {
      status: "tradable",
      restrictionReason: "전매제한 1년 경과",
      restrictionEndDate: "2026-03-10",
      riskFlags: [],
      provenance: officialSrc("2025DONGTAN-B"),
    },
    offering: {
      basePrice: { manwon: 72000, valueProvenance: "sourced", source: officialSrc("2025DONGTAN-B") },
      resalePrice: { manwon: 79000, valueProvenance: "sourced", source: officialSrc("2025DONGTAN-B") },
      downPayment: { manwon: 7200, valueProvenance: "computed" },
      midPaymentPaid: { manwon: 21600, valueProvenance: "user_input" },
      midPaymentRemaining: { manwon: 21600, valueProvenance: "computed" },
    },
  },
  // 전매제한 중 — 🔴 high_risk. 거래 방법 안내 아님, 상태·사유·종료예정만.
  {
    kind: "presale",
    id: "presale-geomdan-c",
    name: "검단신도시 리버센트럴 (분양)",
    regionId: "geomdan",
    price: { sale: { representative: 61000, min: 57000, max: 66000 } },
    sizesPyeong: [24, 33],
    commuteMinutes: COMMUTE_GEOMDAN,
    metrics: { education: 66, infrastructure: 62, environment: 68, futurePotential: 72 },
    moveInYear: 2028,
    households: 720,
    stationDistanceM: 500,
    subscription: {
      announcementDate: "2026-02-20",
      scheduleNote: "청약 종료",
    },
    lifecycle: {
      phase: "transfer_restricted",
      phaseSince: "2026-03-20",
      lastVerifiedAt: "2026-09-01",
      source: officialSrc("2026GEOMDAN-C"),
    },
    transfer: {
      status: "restricted",
      restrictionReason: "전매제한 기간(공고 기준)",
      restrictionEndDate: "2027-03-20",
      riskFlags: ["transfer_restricted"],
      provenance: officialSrc("2026GEOMDAN-C"),
    },
    offering: {
      basePrice: { manwon: 61000, valueProvenance: "sourced", source: officialSrc("2026GEOMDAN-C") },
    },
  },

  // ── 의왕역·의왕시청역 최근 분양(청약홈 실데이터) ──────────
  // 가격(분양가 중앙값)·평형·세대수·입주·lifecycle = 청약홈 실데이터,
  // 통근 = 의왕시 기준 추정, metrics = 추정. 셋 다 청약 종료 상태.
  {
    kind: "presale",
    id: "presale-uiwang-hanshin",
    name: "의왕역 한신더휴 (분양)",
    regionId: "uiwang",
    price: { sale: { representative: 79100, min: 56300, max: 94000 } },
    sizesPyeong: [21, 25, 32, 36],
    commuteMinutes: COMMUTE_UIWANG,
    metrics: { education: 74, infrastructure: 76, environment: 72, futurePotential: 82 },
    moveInYear: 2029,
    households: 108,
    stationDistanceM: 500,
    schoolNearby: true,
    subscription: { announcementDate: "2026-08-13", scheduleNote: "청약 종료" },
    lifecycle: {
      phase: "subscription_closed",
      phaseSince: "2026-08-13",
      lastVerifiedAt: "2026-09-09",
      source: officialSrc("2026000377"),
    },
    offering: {
      basePrice: { manwon: 79100, valueProvenance: "sourced", source: officialSrc("2026000377") },
    },
  },
  {
    kind: "presale",
    id: "presale-uiwang-skview",
    name: "의왕역 SK VIEW (분양)",
    regionId: "uiwang",
    price: { sale: { representative: 89500, min: 39500, max: 109800 } },
    sizesPyeong: [17, 21, 26, 35],
    commuteMinutes: COMMUTE_UIWANG,
    metrics: { education: 74, infrastructure: 76, environment: 72, futurePotential: 82 },
    moveInYear: 2029,
    households: 820,
    stationDistanceM: 400,
    schoolNearby: true,
    subscription: { announcementDate: "2026-07-10", scheduleNote: "청약 종료" },
    lifecycle: {
      phase: "subscription_closed",
      phaseSince: "2026-07-10",
      lastVerifiedAt: "2026-09-09",
      source: officialSrc("2026000301"),
    },
    offering: {
      basePrice: { manwon: 89500, valueProvenance: "sourced", source: officialSrc("2026000301") },
    },
  },
  {
    kind: "presale",
    id: "presale-uiwang-cityhall-ipark",
    name: "의왕시청역 SK VIEW IPARK (분양)",
    regionId: "uiwang",
    price: { sale: { representative: 84365, min: 49640, max: 100720 } },
    sizesPyeong: [20, 22, 25, 31, 35],
    commuteMinutes: COMMUTE_UIWANG,
    metrics: { education: 74, infrastructure: 74, environment: 72, futurePotential: 84 },
    moveInYear: 2030,
    households: 958,
    stationDistanceM: 600,
    schoolNearby: true,
    subscription: { announcementDate: "2025-11-21", scheduleNote: "청약 종료" },
    lifecycle: {
      phase: "subscription_closed",
      phaseSince: "2025-11-21",
      lastVerifiedAt: "2026-09-09",
      source: officialSrc("2025000549"),
    },
    offering: {
      basePrice: { manwon: 84365, valueProvenance: "sourced", source: officialSrc("2025000549") },
    },
  },
];

export function getMockPresale(id: string): PresaleHome | undefined {
  return MOCK_PRESALES.find((p) => p.id === id);
}

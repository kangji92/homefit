import type { PresaleHome } from "@/domain/types";

// 분양 단지 mock (PresaleHome). 분양가·입주예정·청약일정.
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

export const MOCK_PRESALES: readonly PresaleHome[] = [
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
  },
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
      announcementDate: "2026-09-28",
      scheduleNote: "1순위 해당지역 10/06",
    },
  },
];

export function getMockPresale(id: string): PresaleHome | undefined {
  return MOCK_PRESALES.find((p) => p.id === id);
}

// ⚠️ MOCK — 안양종합운동장 동측 재개발 구역 내부 빌라 + 인접 일반 매물. 실제 주소·가격·
// 대지지분·입주권 여부가 아니라 **가공 데이터**다(임의 추정·사실화 금지). 좌표 근사.
// Development Layer 매물 표현 검증용. (docs/design/decision-map.md 개발레이어 §6)

import type { ExistingHome, Home } from "@/domain/types";

const won = (manwon: number) => ({ manwon, valueProvenance: "sourced" as const });
const m2ToPyeong = (m2: number) => Math.round((m2 / 3.3058) * 10) / 10;

// 빌라/연립 공통 seed(정성지표는 mock placeholder).
function villa(
  over: Pick<ExistingHome, "id" | "name" | "location"> & Partial<ExistingHome>,
): ExistingHome {
  const exclusive = over.listing?.exclusiveAreaM2 ?? 50;
  return {
    kind: "existing",
    regionId: "pyeongchon",
    price: { sale: { representative: over.listing?.askingPrice?.manwon ?? 60000 } },
    sizesPyeong: [m2ToPyeong(exclusive)],
    commuteMinutes: {},
    metrics: { education: 55, infrastructure: 60, environment: 55, futurePotential: 55 },
    completionYear: 1998,
    households: 24,
    stationDistanceM: 600,
    housingType: "villa",
    locationAccuracy: "complex",
    ...over,
  };
}

export const MOCK_DEV_PROPERTIES: Home[] = [
  villa({
    id: "villa-anyang-east-1",
    name: "비산동 A빌라(가상)",
    location: { lat: 37.4020, lng: 126.9448 },
    listing: { askingPrice: won(92000), recentTransactionPrice: won(78000), exclusiveAreaM2: 59.5, landShareM2: 33, source: { sourceType: "listing", lastVerifiedAt: "2026-01", verificationStatus: "needs_review" }, updatedAt: "2026-01" },
    redevelopment: { areaId: "dev-anyang-stadium-east", inside: true, occupancyRightStatus: "expected" },
  }),
  villa({
    id: "villa-anyang-east-2",
    name: "비산동 B빌라(가상)",
    location: { lat: 37.4025, lng: 126.9451 },
    listing: { askingPrice: won(78000), recentTransactionPrice: won(71000), exclusiveAreaM2: 46, landShareM2: 26, updatedAt: "2026-01" },
    redevelopment: { areaId: "dev-anyang-stadium-east", inside: true, occupancyRightStatus: "unknown" },
  }),
  villa({
    id: "villa-anyang-east-3",
    name: "비산동 C빌라(가상)",
    location: { lat: 37.4017, lng: 126.9444 },
    listing: { askingPrice: won(105000), recentTransactionPrice: won(96000), exclusiveAreaM2: 72, landShareM2: 41, updatedAt: "2026-01" },
    redevelopment: { areaId: "dev-anyang-stadium-east", inside: true, occupancyRightStatus: "confirmed" },
  }),
  // 구역 외 일반 빌라(재개발 아님) — 비교 대조군.
  villa({
    id: "villa-anyang-general",
    name: "비산동 D빌라(가상·구역 외)",
    location: { lat: 37.3992, lng: 126.9402 },
    listing: { askingPrice: won(61000), recentTransactionPrice: won(58000), exclusiveAreaM2: 49, updatedAt: "2026-01" },
    // redevelopment 없음 → 일반 매물
  }),
  // 인접 아파트(일반 후보) — housingType apartment.
  {
    kind: "existing",
    id: "apt-anyang-adjacent",
    name: "비산동 인접 아파트(가상)",
    regionId: "pyeongchon",
    price: { sale: { representative: 128000 } },
    sizesPyeong: [32],
    commuteMinutes: {},
    metrics: { education: 68, infrastructure: 72, environment: 65, futurePotential: 60 },
    completionYear: 2016,
    households: 640,
    stationDistanceM: 450,
    housingType: "apartment",
    location: { lat: 37.4050, lng: 126.9460 },
    locationAccuracy: "complex",
  },
];

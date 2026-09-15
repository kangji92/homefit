// ✅ REAL(공개 확인값) — 안양권 실단지. mock 샘플이 아니라 실제 존재하는 단지다.
// 큐레이션 2026-09. 원칙: 확인 안 된 값은 지어내지 않는다.
//
// 각 값의 성격(정직 표기):
//  · 정적 사실(세대수·입주/준공년도·평형·위치·행정동) = 공개 소스 확인값.
//  · price(매매/분양가) = **공개 시세·분양가 기준(시점 명시)** — 실거래 평균/최고 등. 시세는
//    변동하며 국토부 원자료 대조 전이라 "추정 포함"으로 본다(공식 확정가 아님).
//  · metrics(0~100) = area-metrics-rubric seed(실측 아님). 점수 표시용 seed일 뿐.
//  · commute = 안양권 mock 추정(MVP). 실제 경로계산 아님.
// 출처: 나무위키/리치고/호갱노노/직방/KB/언론(뉴스톱·경향) — 단지별 공개 페이지.
//
// 좌표는 area 대표점(역/동 중심 근사, accuracy=area). 건물 정밀좌표 아님.

import type { ExistingHome, Home, PresaleHome } from "@/domain/types";

// 안양권 통근(만안/동안) — mock 추정(실경로 아님). complexes.ts의 COMMUTE와 동일 성격.
const COMMUTE_ANYANG = { gangnam: 50, pangyo: 40, yeouido: 40, gwanghwamun: 45, jamsil: 55, magok: 50, "guro-gasan": 20 };
const COMMUTE_PYEONGCHON = { gangnam: 45, pangyo: 30, yeouido: 45, gwanghwamun: 50, jamsil: 50, magok: 55, "guro-gasan": 25 };

// 안양역 푸르지오 더샵 — 만안구 안양동(진흥아파트 재건축), 2,736세대, 2024-10 입주, 안양역 초역세권.
// 시세(2026-04, 공개): 분양권 평균 8.23억 / 최고 12.95억. 전용 41·59·84·99㎡.
const ANYANG_PRUGIO_THESHARP: ExistingHome = {
  kind: "existing",
  id: "anyang-prugio-thesharp",
  name: "안양역 푸르지오 더샵",
  regionId: "anyang",
  price: { sale: { representative: 82000, max: 129500 } }, // 만원 · 공개 시세 기준(추정)
  sizesPyeong: [17, 25, 34, 40], // 전용 41/59/84/99㎡ 공급 근사
  completionYear: 2024,
  households: 2736,
  stationDistanceM: 400, // 안양역 도보 5~7분
  commuteMinutes: COMMUTE_ANYANG,
  metrics: { education: 68, infrastructure: 84, environment: 70, futurePotential: 80 }, // rubric seed(실측 아님)
  schoolNearby: true,
  housingType: "apartment",
  location: { lat: 37.4023, lng: 126.9218 },
  locationAccuracy: "area",
};

// 안양 어반포레 자연& e편한세상 — 만안구, 2,329세대, 2025 입주, 안양역 인근. 전용 46~98㎡.
// 시세(2026-04, 공개): 실거래 평균 7.24억 / 최고 9.92억.
const ANYANG_URBANFORE_EPFS: ExistingHome = {
  kind: "existing",
  id: "anyang-urbanfore-epfs",
  name: "안양 어반포레 자연& e편한세상",
  regionId: "anyang",
  price: { sale: { representative: 72000, max: 99176 } }, // 만원 · 공개 시세 기준(추정)
  sizesPyeong: [18, 24, 30, 34, 40], // 전용 46/59/74/84/98㎡ 공급 근사
  completionYear: 2025,
  households: 2329,
  stationDistanceM: 600,
  commuteMinutes: COMMUTE_ANYANG,
  metrics: { education: 68, infrastructure: 80, environment: 72, futurePotential: 78 }, // rubric seed
  schoolNearby: true,
  housingType: "apartment",
  location: { lat: 37.4008, lng: 126.9195 },
  locationAccuracy: "area",
};

// 평촌자이 퍼스니티 — 동안구 비산동 354-10, 2,737세대(일반분양 570), 지하3~지상33층·26개동,
// 전용 53~133㎡, **2027-12 입주예정(분양권)**. 분양가(공개): 59㎡ ~9.88억 / 84㎡ ~13.3~13.8억.
const PYEONGCHON_XI_PERSONALITY: PresaleHome = {
  kind: "presale",
  id: "pyeongchon-xi-personality",
  name: "평촌자이 퍼스니티",
  regionId: "pyeongchon",
  price: { sale: { representative: 135000, min: 98810, max: 137960 } }, // 만원 · 분양가(공개)
  sizesPyeong: [17, 24, 34, 40, 54], // 전용 53~133㎡ 공급 근사
  moveInYear: 2027,
  households: 2737,
  stationDistanceM: 700,
  commuteMinutes: COMMUTE_PYEONGCHON,
  metrics: { education: 78, infrastructure: 80, environment: 74, futurePotential: 82 }, // rubric seed
  schoolNearby: true,
  housingType: "apartment",
  location: { lat: 37.4045, lng: 126.9432 },
  locationAccuracy: "area",
  subscription: { scheduleNote: "2024년 분양 · 2027-12 입주예정(공개 일정)" },
};

/** 안양권 실단지(기존+분양). homeRepository가 mock 목록에 병합한다. */
export const REAL_COMPLEXES: Home[] = [
  ANYANG_PRUGIO_THESHARP,
  ANYANG_URBANFORE_EPFS,
  PYEONGCHON_XI_PERSONALITY,
];

export function getRealComplex(id: string): Home | undefined {
  return REAL_COMPLEXES.find((c) => c.id === id);
}

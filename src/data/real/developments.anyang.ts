// ✅ REAL(official-backed) — 안양 종합운동장 동측/북측 재개발. mock 아님.
// 출처: 안양시 도시정비 공식 페이지 + 시공사(삼성물산) 자료 + 언론 보도. 각 값의 출처/검증은
// sourceType·verification으로 표기. **확인되지 않은 값은 임의 생성하지 않고 undefined.**
// 주의: 구역 polygon 경계 좌표는 공개 수치 미확보 → point(centroid_only)로만 표현(임의 경계 금지).
// (docs/design 개발레이어 real-pilot §1~7 / 확인일 2026-09-14)

import type { DevelopmentArea } from "@/domain/development";
import type { Money } from "@/domain/types";

const ANYANG_CITY_SRC = "https://www.anyang.go.kr/newtown/sub.do?key=4230";
const won = (manwon: number): Money => ({ manwon, valueProvenance: "sourced" });

/** 종합운동장 동측일원 (비산동 1047-20 일원). 사업시행계획인가 완료(2026-05-19, 2차보도). */
const EAST: DevelopmentArea = {
  id: "dev-anyang-stadium-east",
  name: "종합운동장 동측일원 재개발",
  developmentType: "redevelopment",
  // 사업시행인가 이후 본격 진행 → in_progress / detailStage=implementation.
  stage: "in_progress",
  detailStage: "implementation",
  certainty: "confirmed",
  regionId: "pyeongchon",
  // 경계 수치 미확보 → 대표점만(임의 경계 금지). 좌표는 비산동 종합운동장 동측 근사.
  geometry: { kind: "point", at: { lat: 37.4009, lng: 126.945 } },
  geometryAccuracy: "centroid_only",
  verification: "verified", // identity(사업 존재·구역명) 기준
  source: "안양시 도시정비 - 종합운동장 동측일원",
  sourceUrl: ANYANG_CITY_SRC,
  updatedAt: "2026-09",
  facts: {
    siteAreaM2: 91267, // 공식(일부 보도 91,272)
    landParcelCount: 352,
    existingBuildingCount: 315,
    memberCount: 1374, // 조합원 1,374인(공식)
    parkingSpaces: 2731,
    // 용적률/건폐율은 출처별 상충(267.4%/299.99%/280%) → 임의 확정 안 함(undefined)
  },
  milestones: [
    { kind: "other", label: "정비예정구역 고시", date: "2020-03-09", status: "confirmed", sourceType: "official", sourceUrl: ANYANG_CITY_SRC, verification: "verified" },
    { kind: "designation", label: "정비구역 지정 고시", date: "2022-06-30", status: "confirmed", sourceType: "official", sourceUrl: ANYANG_CITY_SRC, verification: "verified" },
    { kind: "other", label: "조합설립추진위 승인", date: "2022-08-18", status: "confirmed", sourceType: "official", verification: "verified" },
    { kind: "association", label: "조합설립인가", date: "2023-05-08", status: "confirmed", sourceType: "official", verification: "verified" },
    { kind: "other", label: "시공사 선정(삼성물산)", date: "2024-12-22", status: "confirmed", sourceType: "contractor", verification: "reported" },
    // 인가일 primary source = 안양시 공식 추진경위(2026.05.19) → official/verified. 언론은 보조.
    { kind: "implementation", label: "사업시행계획인가", date: "2026-05-19", status: "confirmed", sourceType: "official", sourceUrl: ANYANG_CITY_SRC, verification: "verified" },
    { kind: "management", label: "관리처분계획인가(목표)", date: "2027", status: "target", sourceType: "official", verification: "verified" },
    { kind: "construction", label: "착공(예정)", date: "2028-04", status: "target", sourceType: "contractor", verification: "reported" },
  ],
  plans: [
    {
      id: "east-official-current",
      type: "official",
      totalUnits: 1850,
      saleUnits: 1624, // "분양" 세대. 조합원분양+일반분양 분해 불명 → generalSaleUnits는 미기재
      rentalUnits: 226,
      buildingCount: 16, // 공식
      maxFloor: 35,
      buildingCoverageRatioMax: 30, // 공식 현행: 30% 이하
      floorAreaRatioMax: 267.4, // 공식 현행: 267.4% 이하
      // generalSaleUnits: 공식 근거상 순수 일반분양 분해 불명 → 넣지 않음
      sourceType: "official",
      sourceLabel: "안양시 정비사업 현황 - 종합운동장 동측",
      sourceUrl: ANYANG_CITY_SRC,
      verification: "verified",
    },
    {
      id: "east-contractor-samsung",
      type: "contractor_proposal",
      totalUnits: 1850,
      buildingCount: 14, // 시공사 제안(공식 16과 상충 — 병기)
      maxFloor: 35,
      contractor: "삼성물산",
      brand: "래미안 하이스티지(가칭)",
      proposedComplexName: "래미안 하이스티지(가칭)",
      sourceType: "contractor",
      sourceLabel: "삼성물산 제안(2024-12 선정)",
      sourceUrl: "https://news.samsungcnt.com/",
      verification: "reported",
    },
    {
      id: "east-designation-initial",
      type: "official",
      totalUnits: 1662, // 최초 지정고시(2022) 계획 — 이력 보존
      buildingCoverageRatioMax: 50, // 최초 지정: 50% 이하
      floorAreaRatioMax: 280, // 최초 지정: 280% 이하 (현행 267.4와 병존)
      sourceType: "official",
      sourceLabel: "정비구역 지정고시(2022) 최초 계획",
      verification: "verified",
      effectiveDate: "2022-06-30",
    },
  ],
  // ⚠️ broker/미확인 — 현장 중개사 자료 예시. official 취급 금지(공식/조합 확인 전).
  memberSaleEstimates: [
    {
      sizeLabel: "84㎡",
      price: { min: won(110000), max: won(115000) }, // 11억~11.5억
      sourceType: "broker",
      sourceLabel: "현장 중개사(미확인)",
      verification: "unverified",
    },
  ],
};

/** 종합운동장 북측 일원 (비산동 1015-22 일원). 조합설립인가 완료, 사업시행인가 예정.
 *  값: 안양시 정비사업 현황 공식 페이지(사용자 확인). */
const NORTH: DevelopmentArea = {
  id: "dev-anyang-stadium-north",
  name: "종합운동장 북측 일원 재개발",
  developmentType: "redevelopment",
  // 조합설립인가 완료·사업시행 예정 → 동측과 구분 위해 approved / detailStage=association.
  stage: "approved",
  detailStage: "association",
  certainty: "confirmed",
  regionId: "pyeongchon",
  geometry: { kind: "point", at: { lat: 37.4042, lng: 126.9425 } },
  geometryAccuracy: "centroid_only",
  verification: "verified",
  source: "안양시 정비사업 현황 - 종합운동장 북측 일원",
  updatedAt: "2026-03",
  facts: {
    siteAreaM2: 64375.3,
    landParcelCount: 243,
    existingBuildingCount: 219,
    existingHouseholds: 910,
    memberCount: 911,
    parkingSpaces: 2092,
    buildingCoverageRatio: 17.6,
    floorAreaRatio: 299.88,
    basementFloors: 3,
  },
  milestones: [
    { kind: "other", label: "정비예정구역 고시", date: "2020-03-09", status: "confirmed", sourceType: "official", verification: "verified" },
    { kind: "designation", label: "정비계획 결정·정비구역 지정 고시", date: "2022-05-23", status: "confirmed", sourceType: "official", verification: "verified" },
    { kind: "other", label: "조합설립추진위 승인 (동의율 56.86%, 518/911)", date: "2022-07-21", status: "confirmed", sourceType: "official", verification: "verified" },
    { kind: "association", label: "조합설립인가 (동의율 80.35%, 732/911)", date: "2023-08-16", status: "confirmed", sourceType: "official", verification: "verified" },
    { kind: "other", label: "정비계획 결정·정비구역 지정 변경", date: "2024-10-15", status: "confirmed", sourceType: "official", verification: "verified" },
    { kind: "other", label: "통합심의위원회 개최", date: "2025-09-30", status: "confirmed", sourceType: "official", verification: "verified" },
    { kind: "other", label: "정비계획 변경 결정 고시", date: "2026-03-11", status: "confirmed", sourceType: "official", verification: "verified" },
    { kind: "implementation", label: "사업시행계획인가(목표)", date: "2026", status: "target", sourceType: "official", verification: "verified" },
  ],
  plans: [
    {
      id: "north-official-current",
      type: "official",
      totalUnits: 1286,
      saleUnits: 1132, // "분양" 세대(일반분양 아님 — generalSaleUnits 미기재)
      rentalUnits: 154,
      buildingCount: 10,
      maxFloor: 39,
      sourceType: "official",
      sourceLabel: "안양시 정비사업 현황 - 종합운동장 북측 일원",
      verification: "verified",
    },
  ],
};

export const REAL_DEVELOPMENTS: DevelopmentArea[] = [EAST, NORTH];

export function getRealDevelopment(id: string): DevelopmentArea | undefined {
  return REAL_DEVELOPMENTS.find((d) => d.id === id);
}

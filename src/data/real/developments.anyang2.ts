// ✅ REAL(official-backed) — 안양 정비사업 구역 추가분(종합운동장 동측/북측 외).
// 공식 소스 우선(직접 확보 가능한 값만):
//  · 경계 = NSDI 정비구역 SHP(LSMD_CONT_UD602_5174_41, EPSG:5174→WGS84) → official_boundary.
//  · 지정고시/정식구역명 = 같은 SHP의 DBF 속성(NTFDATE 고시일 · MNUM 관리번호 지정연도 ·
//    REMARK 정식명칭) → sourceType official / verification verified. (국토부 공식 GIS)
//  · siteAreaM2 = SHP shoelace 면적(㎡, 근사).
//  · 현재 사업단계/시공사 = 안양시 도시정비 + 언론 2차자료 → reported. **미확인은 undefined.**
//    (공식 단계표: 공공데이터포털 '안양시 일반 정비사업 추진현황'은 오픈API 키 필요 → 미반영.)
// 큐레이션 2026-09.

import type { DevelopmentArea, DevelopmentMilestone } from "@/domain/development";
import {
  YEOKSEGWON_RING,
  NEWTOWN_SAMHO_RING,
  GWANYANG_HYUNDAI_RING,
  HOGYE_LUCKY_RING,
  BISAN_SCHOOL_RING,
  HOGYE_ONCHEON_RING,
} from "./geometry.anyang.dev";

const ANYANG_NEWTOWN_SRC = "https://www.anyang.go.kr/newtown/index.do";
const NSDI_SRC = "https://www.nsdi.go.kr"; // 정비구역 SHP(LSMD_CONT_UD602) 출처

// 정비구역 지정고시 milestone(공식 — SHP DBF의 NTFDATE/MNUM). date가 연도만이면 관리번호 기준.
const designation = (date: string, exact: boolean): DevelopmentMilestone => ({
  kind: "designation",
  label: exact ? "정비구역 지정고시" : `정비구역 지정(관리번호 기준 ${date})`,
  date,
  status: "confirmed",
  sourceType: "official",
  sourceUrl: NSDI_SRC,
  verification: "verified",
});

// 안양역세권지구 재개발 — 만안구 안양동. 지정고시 2015-08-07(공식). 철거완료·착공예정(언론).
const YEOKSEGWON: DevelopmentArea = {
  id: "dev-anyang-yeoksegwon",
  name: "안양역세권지구 재개발",
  developmentType: "redevelopment",
  stage: "in_progress",
  detailStage: "demolition", // 이주·철거 완료, 착공 예정
  certainty: "confirmed",
  regionId: "anyang",
  geometry: { kind: "polygon", rings: [YEOKSEGWON_RING] },
  geometryAccuracy: "official_boundary",
  verification: "verified", // identity(공식 정비구역·경계·지정)
  facts: { siteAreaM2: 27441 }, // SHP 면적(근사)
  plans: [
    { id: "yeoksegwon-contractor", type: "contractor_proposal", contractor: "HDC현대산업개발·BS한양", sourceType: "media", sourceLabel: "언론(하우징헤럴드)", verification: "reported" },
  ],
  milestones: [
    designation("2015-08-07", true), // NTFDATE(공식)
    { kind: "other", label: "이주·철거 완료", status: "confirmed", sourceType: "media", verification: "reported" },
    { kind: "construction", label: "착공(예정)", status: "target", sourceType: "media", verification: "reported" },
  ],
  summary: "2015-08-07 정비구역 지정(공식). 철거 완료·착공 예정(언론). 시공사 HDC현대산업개발·BS한양.",
  source: "NSDI 정비구역 SHP(경계·지정) + 안양시/언론(단계)",
  sourceUrl: ANYANG_NEWTOWN_SRC,
  updatedAt: "2026-09",
};

// 뉴타운맨션삼호아파트지구 주택재건축(REMARK 정식명) → 평촌자이 퍼스니티. 지정 2023(MNUM).
const NEWTOWN_SAMHO: DevelopmentArea = {
  id: "dev-anyang-newtown-samho",
  name: "뉴타운맨션삼호 재건축(평촌자이 퍼스니티)",
  developmentType: "reconstruction",
  stage: "in_progress",
  detailStage: "construction",
  certainty: "confirmed",
  regionId: "pyeongchon",
  geometry: { kind: "polygon", rings: [NEWTOWN_SAMHO_RING] },
  geometryAccuracy: "official_boundary",
  verification: "verified",
  facts: { siteAreaM2: 125964 },
  plans: [
    { id: "samho-plan", type: "official", totalUnits: 2737, brand: "자이", proposedComplexName: "평촌자이 퍼스니티", sourceType: "media", sourceLabel: "언론/분양 공개", verification: "reported" },
  ],
  milestones: [
    designation("2023", false), // MNUM 관리번호 지정연도(공식)
    { kind: "construction", label: "착공(공사 중)", status: "confirmed", sourceType: "media", verification: "reported" },
    { kind: "move_in", label: "입주(예정)", date: "2027-12", status: "target", sourceType: "media", verification: "reported" },
  ],
  summary: "정식명 '뉴타운맨션삼호아파트지구 주택재건축 정비구역'. 재건축 → 평촌자이 퍼스니티(2,737세대, 2027-12 입주예정).",
  source: "NSDI 정비구역 SHP(경계·지정) + 분양 공개자료(단계)",
  sourceUrl: ANYANG_NEWTOWN_SRC,
  updatedAt: "2026-09",
};

// 관양동 현대아파트 재건축 — 동안구 관양동. 지정고시 2020-09-22(공식). 심의통과·사업시행인가 예정(언론).
const GWANYANG_HYUNDAI: DevelopmentArea = {
  id: "dev-anyang-gwanyang-hyundai",
  name: "관양동 현대아파트 재건축",
  developmentType: "reconstruction",
  stage: "approved",
  detailStage: "association",
  certainty: "likely",
  regionId: "pyeongchon",
  geometry: { kind: "polygon", rings: [GWANYANG_HYUNDAI_RING] },
  geometryAccuracy: "official_boundary",
  verification: "verified",
  facts: { siteAreaM2: 62557 },
  plans: [
    { id: "gwanyang-contractor", type: "contractor_proposal", contractor: "HDC현대산업개발", sourceType: "media", verification: "reported" },
  ],
  milestones: [
    designation("2020-09-22", true), // NTFDATE(공식)
    { kind: "other", label: "건축심의 통과", status: "confirmed", sourceType: "media", verification: "reported" },
    { kind: "implementation", label: "사업시행인가(예정)", status: "target", sourceType: "media", verification: "reported" },
  ],
  summary: "2020-09-22 정비구역 지정(공식). 건축심의 통과·사업시행인가 예정. 시공사 HDC현대산업개발(언론).",
  source: "NSDI 정비구역 SHP(경계·지정) + 언론(단계)",
  updatedAt: "2026-09",
};

// 아래 3곳: 경계·지정연도는 공식(SHP), 현재 사업단계 상세는 미확인 → certainty로 정직 표기.
const HOGYE_LUCKY: DevelopmentArea = {
  id: "dev-anyang-hogye-lucky",
  name: "호계럭키아파트지구 재건축",
  developmentType: "reconstruction", // 아파트지구 → 재건축(추정)
  stage: "planned",
  detailStage: "designation",
  certainty: "uncertain",
  regionId: "pyeongchon",
  geometry: { kind: "polygon", rings: [HOGYE_LUCKY_RING] },
  geometryAccuracy: "official_boundary",
  verification: "verified", // 구역 identity·지정만(현재 단계 미확인)
  facts: { siteAreaM2: 45859 },
  milestones: [designation("2025", false)], // MNUM 지정연도(공식)
  summary: "정비구역 지정 2025(공식 관리번호 기준). 현재 사업단계 상세는 미확인.",
  source: "NSDI 정비구역 SHP",
  updatedAt: "2026-09",
};

const BISAN_SCHOOL: DevelopmentArea = {
  id: "dev-anyang-bisan-school",
  name: "비산초교주변지구 재개발",
  developmentType: "redevelopment",
  stage: "planned",
  detailStage: "designation",
  certainty: "uncertain",
  regionId: "pyeongchon",
  geometry: { kind: "polygon", rings: [BISAN_SCHOOL_RING] },
  geometryAccuracy: "official_boundary",
  verification: "verified",
  facts: { siteAreaM2: 114548 },
  milestones: [designation("2015", false)],
  summary: "정식명 '비산초교주변지구'. 정비구역 지정 2015(공식). 현재 사업단계 상세는 미확인.",
  source: "NSDI 정비구역 SHP",
  updatedAt: "2026-09",
};

const HOGYE_ONCHEON: DevelopmentArea = {
  id: "dev-anyang-hogye-oncheon",
  name: "호계온천 주변지구 재개발",
  developmentType: "redevelopment",
  stage: "planned",
  detailStage: "designation",
  certainty: "uncertain",
  regionId: "pyeongchon",
  geometry: { kind: "polygon", rings: [HOGYE_ONCHEON_RING] },
  geometryAccuracy: "official_boundary",
  verification: "verified",
  facts: { siteAreaM2: 39750 },
  milestones: [designation("2022", false)],
  summary: "정식명 '호계온천 주변지구'. 정비구역 지정 2022(공식). 현재 사업단계 상세는 미확인.",
  source: "NSDI 정비구역 SHP",
  updatedAt: "2026-09",
};

/** 종합운동장 동측/북측 외 안양 정비사업 구역(경계·지정 공식, 단계 일부 2차자료). */
export const REAL_DEVELOPMENTS_ANYANG_MORE: DevelopmentArea[] = [
  YEOKSEGWON,
  NEWTOWN_SAMHO,
  GWANYANG_HYUNDAI,
  HOGYE_LUCKY,
  BISAN_SCHOOL,
  HOGYE_ONCHEON,
];

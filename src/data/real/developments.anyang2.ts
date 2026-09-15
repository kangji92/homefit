// ✅ REAL(official-backed) — 안양 정비사업 구역 추가분(종합운동장 동측/북측 외).
// 경계: NSDI 정비구역 SHP(LSMD_CONT_UD602_5174_41, EPSG:5174→WGS84)의 실제 경계 →
//   geometryAccuracy: official_boundary. siteAreaM2는 SHP shoelace 면적(㎡, 근사).
// 사업단계/시공사: 안양시 도시정비 + 언론(하우징헤럴드/위클리한국주택경제) 2차 자료 →
//   verification: reported/unverified. **확인 안 된 값은 지어내지 않는다**(undefined).
// identity(구역 존재·경계)는 공식 GIS라 verified. 단계 상세가 불확실하면 certainty로 표기.
// 큐레이션 2026-09.

import type { DevelopmentArea } from "@/domain/development";
import {
  YEOKSEGWON_RING,
  NEWTOWN_SAMHO_RING,
  GWANYANG_HYUNDAI_RING,
  HOGYE_LUCKY_RING,
  BISAN_SCHOOL_RING,
  HOGYE_ONCHEON_RING,
} from "./geometry.anyang.dev";

const ANYANG_NEWTOWN_SRC = "https://www.anyang.go.kr/newtown/index.do";

// 안양역세권지구 재개발 — 만안구 안양동. 철거 완료·착공 예정. 시공사 HDC현산·BS한양(언론).
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
  verification: "verified", // identity(공식 정비구역·경계)
  facts: { siteAreaM2: 27441 }, // SHP 면적(근사)
  plans: [
    { id: "yeoksegwon-contractor", type: "contractor_proposal", contractor: "HDC현대산업개발·BS한양", sourceType: "media", sourceLabel: "언론(하우징헤럴드)", verification: "reported" },
  ],
  milestones: [
    { kind: "other", label: "이주·철거 완료", status: "confirmed", sourceType: "media", verification: "reported" },
    { kind: "construction", label: "착공(예정)", status: "target", sourceType: "media", verification: "reported" },
  ],
  summary: "철거 완료·착공 예정(2026 기준). 시공사 HDC현대산업개발·BS한양(언론).",
  source: "안양시 도시정비 / 언론",
  sourceUrl: ANYANG_NEWTOWN_SRC,
  updatedAt: "2026-09",
};

// 뉴타운맨션삼호아파트지구 재건축 — 동안구 비산동. 착공 중 → 평촌자이 퍼스니티(2027-12 입주예정).
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
    { kind: "construction", label: "착공(공사 중)", status: "confirmed", sourceType: "media", verification: "reported" },
    { kind: "move_in", label: "입주(예정)", date: "2027-12", status: "target", sourceType: "media", verification: "reported" },
  ],
  summary: "재건축 → 평촌자이 퍼스니티(2,737세대, 2027-12 입주예정).",
  source: "안양시 도시정비 / 분양 공개자료",
  sourceUrl: ANYANG_NEWTOWN_SRC,
  updatedAt: "2026-09",
};

// 관양동 현대아파트 재건축 — 동안구 관양동. 건축심의 통과·사업시행인가 예정. 시공사 HDC현산(언론).
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
    { kind: "other", label: "건축심의 통과", status: "confirmed", sourceType: "media", verification: "reported" },
    { kind: "implementation", label: "사업시행인가(예정)", status: "target", sourceType: "media", verification: "reported" },
  ],
  summary: "건축심의 통과·사업시행인가 예정. 시공사 HDC현대산업개발(언론).",
  source: "언론(하우징헤럴드)",
  updatedAt: "2026-09",
};

// 아래 3곳: 공식 정비구역(경계 확인)이나 현재 사업단계 상세는 미확인 → certainty/summary로 정직 표기.
const HOGYE_LUCKY: DevelopmentArea = {
  id: "dev-anyang-hogye-lucky",
  name: "호계럭키아파트지구 재건축",
  developmentType: "reconstruction", // 아파트지구 → 재건축(추정)
  stage: "approved",
  detailStage: "designation",
  certainty: "likely",
  regionId: "pyeongchon",
  geometry: { kind: "polygon", rings: [HOGYE_LUCKY_RING] },
  geometryAccuracy: "official_boundary",
  verification: "verified", // 구역 identity만(단계 상세 미확인)
  facts: { siteAreaM2: 45859 },
  summary: "공식 정비구역(경계 확인). 현재 사업단계 상세는 미확인.",
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
  summary: "공식 정비(예정)구역(경계 확인). 사업단계 상세는 미확인.",
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
  summary: "공식 정비(예정)구역(경계 확인). 사업단계 상세는 미확인.",
  source: "NSDI 정비구역 SHP",
  updatedAt: "2026-09",
};

/** 종합운동장 동측/북측 외 안양 정비사업 구역(경계 공식·단계 일부 2차자료). */
export const REAL_DEVELOPMENTS_ANYANG_MORE: DevelopmentArea[] = [
  YEOKSEGWON,
  NEWTOWN_SAMHO,
  GWANYANG_HYUNDAI,
  HOGYE_LUCKY,
  BISAN_SCHOOL,
  HOGYE_ONCHEON,
];

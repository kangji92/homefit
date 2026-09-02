import type { Dealbreakers } from "@/domain/types";

// failedDealbreakers 키 → 사용자 친화 한국어 (docs/design/complex-detail.md §12)
// 상세·비교 화면이 공유하므로 lib에 둔다(피처 간 교차 import 회피).
export const DEALBREAKER_LABELS: Record<keyof Dealbreakers, string> = {
  maxPrice: "최대 가격 초과",
  minSizePyeong: "희망 평형 없음",
  maxStationDistanceM: "역과의 거리 초과",
  maxBuildingAgeYears: "연식 초과",
  minHouseholds: "세대수 부족",
  requireSchoolNearby: "학교 접근성 미달",
};

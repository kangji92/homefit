// 지역 참조 매칭 · hard/soft 제약 (순수). excluded·stay_current_area는 hard(제외),
// prefer_nearby·want_to_leave·preferred는 soft(주석/우선순위)로 다르게 처리한다.
// (docs/design/current-housing.md §2,§3)

import type {
  CurrentHousing,
  Home,
  HousingStatus,
  RegionPreferences,
  RegionRef,
  Tenure,
} from "../types";

/** 현재 점유형태 → 자격용 housingStatus(자가만 유주택). 자격 계층 연결용. */
export function tenureToHousingStatus(tenure: Tenure): HousingStatus {
  return tenure === "owner" ? "own" : "none";
}

/** MVP: flat id 동등. 계층 확장 시 containment(시⊃구⊃생활권)로 대체. */
export function regionRefMatches(ref: RegionRef, regionId: string): boolean {
  return ref.id === regionId;
}

export function isExcludedRegion(regionId: string, prefs?: RegionPreferences): boolean {
  return !!prefs?.excluded.some((r) => regionRefMatches(r, regionId));
}
export function isPreferredRegion(regionId: string, prefs?: RegionPreferences): boolean {
  return !!prefs?.preferred.some((r) => regionRefMatches(r, regionId));
}

/**
 * 생성/추천 입력에서 **hard 제약**으로 거른다.
 *  - excluded 지역 → 제외
 *  - movePreference==="stay_current_area" → 현재 지역만 유지
 * soft(prefer_nearby/want_to_leave/preferred)는 여기서 거르지 않는다.
 */
export function filterHomesByRegion(
  homes: Home[],
  opts: { current?: CurrentHousing; prefs?: RegionPreferences },
): Home[] {
  const currentRegionId = opts.current?.regionRef?.id;
  const stayHard =
    opts.current?.movePreference === "stay_current_area" && !!currentRegionId;
  return homes.filter((h) => {
    if (isExcludedRegion(h.regionId, opts.prefs)) return false;
    if (stayHard && h.regionId !== currentRegionId) return false;
    return true;
  });
}

/** soft 신호(주석/정렬용) — 필터가 아니다. 클수록 우선. */
export function regionSoftBoost(
  regionId: string,
  opts: { current?: CurrentHousing; prefs?: RegionPreferences },
): number {
  let b = 0;
  if (isPreferredRegion(regionId, opts.prefs)) b += 2;
  const currentRegionId = opts.current?.regionRef?.id;
  const mp = opts.current?.movePreference;
  if (currentRegionId) {
    const same = regionId === currentRegionId;
    if (mp === "prefer_nearby" && same) b += 1;
    if (mp === "want_to_leave" && same) b -= 1;
  }
  return b;
}

/** 현재 생활권 대비 이동 여부(표시용). */
export function regionMoveNote(
  regionId: string,
  current?: CurrentHousing,
): "stay" | "move" | "unknown" {
  const cur = current?.regionRef?.id;
  if (!cur) return "unknown";
  return regionId === cur ? "stay" : "move";
}

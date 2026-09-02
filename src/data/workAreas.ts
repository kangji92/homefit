// 근무지역 프리셋 (docs/design/onboarding.md §2).
// MVP 통근 모델: workplace.id = areaId. domain/scoring은 이 모듈에 의존하지 않는다.
// 향후 지도/장소검색 API 도입 시 이 데이터 레이어만 교체한다.

export interface WorkArea {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

export const WORK_AREAS: readonly WorkArea[] = [
  { id: "gangnam", label: "강남", lat: 37.4979, lng: 127.0276 },
  { id: "pangyo", label: "판교", lat: 37.3948, lng: 127.1112 },
  { id: "yeouido", label: "여의도", lat: 37.5219, lng: 126.9245 },
  { id: "gwanghwamun", label: "광화문", lat: 37.5726, lng: 126.9769 },
  { id: "jamsil", label: "잠실", lat: 37.5133, lng: 127.1 },
  { id: "magok", label: "마곡", lat: 37.56, lng: 126.826 },
  { id: "guro-gasan", label: "구로·가산", lat: 37.4802, lng: 126.8828 },
];

export const WORK_AREA_IDS: readonly string[] = WORK_AREAS.map((a) => a.id);

export function getWorkArea(id: string): WorkArea | undefined {
  return WORK_AREAS.find((a) => a.id === id);
}

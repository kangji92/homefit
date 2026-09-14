// ⚠️ MOCK — 안양 일대 개발사업 중 **아직 실데이터로 확정하지 않은** 항목만.
// 종합운동장 동측/북측 재개발은 real로 이관됨(data/real/developments.anyang.ts).
// 여기 남은 월판선·장기검토는 개념 경로/근사(가상). (docs/design/decision-map.md 개발레이어)

import type { DevelopmentArea } from "@/domain/development";

export const MOCK_DEVELOPMENTS: DevelopmentArea[] = [
  {
    id: "dev-wolpan-line",
    name: "월판선(가상 경로)",
    developmentType: "railway",
    stage: "in_progress",
    detailStage: "construction",
    certainty: "confirmed",
    geometry: {
      kind: "line",
      path: [
        { lat: 37.3952, lng: 126.9352 },
        { lat: 37.4005, lng: 126.9448 },
        { lat: 37.4051, lng: 126.9552 },
      ],
    },
    geometryAccuracy: "approximate",
    summary: "mock — 실제 노선/역 위치 아님(개념 경로)",
    source: "mock",
  },
  {
    id: "dev-transit-longterm",
    name: "장기검토 교통계획(가칭)",
    developmentType: "railway",
    stage: "planned",
    certainty: "uncertain",
    geometry: {
      kind: "line",
      path: [
        { lat: 37.4082, lng: 126.9302 },
        { lat: 37.4122, lng: 126.9402 },
      ],
    },
    geometryAccuracy: "approximate",
    summary: "mock — 확정성 낮은 장기검토 예시",
    source: "mock",
  },
];

export function getMockDevelopment(id: string): DevelopmentArea | undefined {
  return MOCK_DEVELOPMENTS.find((d) => d.id === id);
}

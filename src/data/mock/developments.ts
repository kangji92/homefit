// ⚠️ MOCK — 안양 비산동 안양종합운동장 일대. 실제 사업 단계·경계·좌표·노선이 아니라
// Development Layer UX 검증용 **가공 데이터**다. 좌표는 근사, 단계/확정성은 예시.
// 실제 정보로 오인하지 말 것. (docs/design/decision-map.md 개발레이어 §6)

import type { DevelopmentArea } from "@/domain/development";

export const MOCK_DEVELOPMENTS: DevelopmentArea[] = [
  {
    id: "dev-anyang-stadium-east",
    name: "안양종합운동장 동측 재개발(가상)",
    developmentType: "redevelopment",
    stage: "in_progress",
    detailStage: "implementation", // 사업시행인가 (가정)
    certainty: "confirmed",
    regionId: "pyeongchon",
    geometry: {
      kind: "polygon",
      rings: [[
        { lat: 37.4008, lng: 126.9452 },
        { lat: 37.4031, lng: 126.9460 },
        { lat: 37.4036, lng: 126.9438 },
        { lat: 37.4014, lng: 126.9432 },
      ]],
    },
    summary: "mock — 사업시행인가 단계로 가정한 가상 구역",
    source: "mock",
    updatedAt: "2026-01",
  },
  {
    id: "dev-anyang-stadium-north",
    name: "안양종합운동장 북측 재개발(가상)",
    developmentType: "redevelopment",
    stage: "in_progress",
    detailStage: "association", // 조합설립 (가정·미확인)
    certainty: "likely",
    regionId: "pyeongchon",
    geometry: {
      kind: "polygon",
      rings: [[
        { lat: 37.4041, lng: 126.9428 },
        { lat: 37.4062, lng: 126.9434 },
        { lat: 37.4064, lng: 126.9412 },
        { lat: 37.4043, lng: 126.9408 },
      ]],
    },
    summary: "mock — 조합설립 단계로 가정(미확인)",
    source: "mock",
  },
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
    summary: "mock — 확정성 낮은 장기검토 예시",
    source: "mock",
  },
];

export function getMockDevelopment(id: string): DevelopmentArea | undefined {
  return MOCK_DEVELOPMENTS.find((d) => d.id === id);
}

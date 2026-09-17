import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { DevelopmentArea } from "@/domain/development";

const won = (manwon: number) => ({ manwon, valueProvenance: "sourced" as const });
const area: DevelopmentArea = {
  id: "dev-east", name: "종합운동장 동측일원 재개발", developmentType: "redevelopment",
  stage: "in_progress", detailStage: "implementation", certainty: "confirmed", regionId: "pyeongchon",
  geometry: { kind: "polygon", rings: [[{ lat: 37.4, lng: 126.94 }, { lat: 37.41, lng: 126.95 }, { lat: 37.4, lng: 126.95 }]] },
  geometryAccuracy: "official_boundary", verification: "verified",
  milestones: [{ kind: "implementation", label: "사업시행계획인가", date: "2026-05-19", status: "confirmed", sourceType: "official", verification: "verified" }],
  memberSaleEstimates: [
    { id: "east-84", sizeLabel: "84㎡", price: { min: won(110000), max: won(115000) }, sourceType: "broker", verification: "unverified" },
    { id: "east-59", sizeLabel: "59㎡", sourceType: "broker", verification: "unverified" },
  ],
};

const { useDevelopmentMock } = vi.hoisted(() => ({ useDevelopmentMock: vi.fn() }));
vi.mock("@/hooks/queries", () => ({ useDevelopment: (id: string) => useDevelopmentMock(id) }));
// 지도는 Kakao SDK 의존 → stub. scene에 개발 오버레이가 전달되는지만 확인.
vi.mock("@/features/decisionMap", () => ({
  DecisionMap: (props: { scene: { developments?: { id: string }[] } }) => (
    <div data-testid="map" data-devs={props.scene.developments?.map((d) => d.id).join(",") ?? ""} />
  ),
  DevelopmentDetailPanel: ({ area }: { area: DevelopmentArea }) => <div>detail:{area.name}</div>,
  buildDecisionMapScene: (input: { developments?: DevelopmentArea[]; selectedDevelopmentId?: string }) => ({
    entities: [], relations: [], boundsTargets: [],
    developments: (input.developments ?? []).map((d) => ({ id: d.id, selected: d.id === input.selectedDevelopmentId })),
  }),
  FieldPropertyCTA: () => <div>cta</div>,
}));

import { DevelopmentFeature } from "./DevelopmentFeature";

describe("DevelopmentFeature", () => {
  it("전용 상세 — 그 구역만 담은 경계 지도 + 상세 패널 + 평형별 예정분양가", () => {
    useDevelopmentMock.mockReturnValue({ data: area, isLoading: false });
    render(<DevelopmentFeature id="dev-east" />);
    // 이 구역만 지도 scene에 전달
    expect(screen.getByTestId("map").getAttribute("data-devs")).toBe("dev-east");
    // 상세 패널 + 평형별 예정분양가(근거 있는 84㎡만 금액, 59㎡은 미확보)
    expect(screen.getByText("detail:종합운동장 동측일원 재개발")).toBeInTheDocument();
    expect(screen.getByText("11억 ~ 11.5억")).toBeInTheDocument();
    expect(screen.getByText("예정가 미확보")).toBeInTheDocument();
  });

  it("없는 id는 not-found", () => {
    useDevelopmentMock.mockReturnValue({ data: null, isLoading: false });
    render(<DevelopmentFeature id="nope" />);
    expect(screen.getByText("정비사업 구역을 찾을 수 없어요.")).toBeInTheDocument();
  });
});

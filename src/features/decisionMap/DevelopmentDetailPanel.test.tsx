import { render, screen, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { DevelopmentArea } from "@/domain/development";
import { DevelopmentDetailPanel } from "./DevelopmentDetailPanel";

const area: DevelopmentArea = {
  id: "dev-east", name: "안양 동측 재개발(pilot)", developmentType: "redevelopment",
  stage: "in_progress", detailStage: "implementation", certainty: "confirmed",
  geometry: { kind: "polygon", rings: [[]] }, geometryAccuracy: "traced_from_official_map",
  verification: "verified",
  milestones: [
    { kind: "implementation", date: "2024-05", status: "confirmed", sourceType: "official", verification: "verified" },
    { kind: "management", date: "2026", status: "planned", sourceType: "media", verification: "reported" },
  ],
  plans: [
    { id: "p-official", type: "official", totalUnits: 1850, buildingCount: 16, sourceType: "official", verification: "verified" },
    { id: "p-contractor", type: "contractor_proposal", totalUnits: 1850, buildingCount: 14, contractor: "○○건설", sourceType: "contractor", verification: "reported" },
  ],
};

describe("DevelopmentDetailPanel", () => {
  it("Area 검증은 identity 기준임을 고지한다", () => {
    render(<DevelopmentDetailPanel area={area} />);
    expect(screen.getByText(/사업 존재·구역\/사업명/)).toBeInTheDocument();
  });

  it("동수처럼 출처가 다른 값은 나란히 보여준다(합치지 않음)", () => {
    render(<DevelopmentDetailPanel area={area} />);
    const panel = screen.getByLabelText("개발사업 상세");
    expect(within(panel).getByText("16")).toBeInTheDocument(); // 공식
    expect(within(panel).getByText("14")).toBeInTheDocument(); // 시공사
  });

  it("총세대수가 같으면 단일 표시", () => {
    render(<DevelopmentDetailPanel area={area} />);
    expect(screen.getAllByText("1,850").length).toBe(1);
  });

  it("일정의 확정/예정을 구분한다", () => {
    render(<DevelopmentDetailPanel area={area} />);
    expect(screen.getByText("확정")).toBeInTheDocument();
    expect(screen.getByText("예정")).toBeInTheDocument();
  });

  it("geometry accuracy를 공식 경계와 구분해 표기", () => {
    render(<DevelopmentDetailPanel area={area} />);
    expect(screen.getByText(/공식도면 수기/)).toBeInTheDocument();
  });
});

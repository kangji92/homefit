import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { DevelopmentArea } from "@/domain/development";
import { DevelopmentStageProgress } from "./DevelopmentStageProgress";

const base: Omit<DevelopmentArea, "milestones" | "stage"> = {
  id: "d", name: "구역", developmentType: "redevelopment", detailStage: "implementation",
  certainty: "confirmed", geometry: { kind: "point", at: { lat: 37.4, lng: 126.9 } },
};

describe("DevelopmentStageProgress", () => {
  it("확정 milestone이 있는 단계만 완료(✓)로 표시한다", () => {
    const area: DevelopmentArea = {
      ...base, stage: "in_progress",
      milestones: [
        { kind: "designation", status: "confirmed", label: "지정" },
        { kind: "association", status: "confirmed", label: "조합" },
        { kind: "implementation", status: "confirmed", label: "사업시행" },
        { kind: "management", status: "target", label: "관리처분(예정)" }, // 목표는 완료 아님
      ],
    };
    render(<DevelopmentStageProgress area={area} />);
    // 구역지정·조합설립·사업시행 3개 완료 → ✓ 3개
    expect(screen.getAllByText("✓")).toHaveLength(3);
    // 아직 안 온 단계는 번호로(예: 관리처분=4)
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("준공(completed)이면 마지막 단계까지 완료", () => {
    const area: DevelopmentArea = {
      ...base, stage: "completed",
      milestones: [
        { kind: "designation", status: "confirmed" },
        { kind: "construction", status: "confirmed" },
      ],
    };
    render(<DevelopmentStageProgress area={area} />);
    // 구역지정 + 착공 + 준공(stage=completed) = 3개 완료
    expect(screen.getAllByText("✓")).toHaveLength(3);
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { DevelopmentArea } from "@/domain/development";
import { DevelopmentAreaCard } from "./DevelopmentAreaCard";

const area: DevelopmentArea = {
  id: "dev-x", name: "동측 재개발", developmentType: "redevelopment",
  stage: "in_progress", detailStage: "implementation", certainty: "confirmed",
  geometry: { kind: "point", at: { lat: 37.4, lng: 126.9 } },
};

describe("DevelopmentAreaCard", () => {
  it("localFit이 있으면 지역 적합도 게이지 + '개발 성과 아님' 고지", () => {
    render(<DevelopmentAreaCard area={area} localFit={78} />);
    expect(screen.getByRole("img", { name: /적합도 78점/ })).toBeInTheDocument();
    expect(screen.getByText(/위치·교통·학군 기준\(개발 성과 아님\)/)).toBeInTheDocument();
  });

  it("localFit 없으면 게이지 없이 정보만(점수 없음 고지)", () => {
    render(<DevelopmentAreaCard area={area} />);
    expect(screen.queryByRole("img", { name: /적합도/ })).not.toBeInTheDocument();
    expect(screen.getByText(/적합도 점수 없음/)).toBeInTheDocument();
  });
});

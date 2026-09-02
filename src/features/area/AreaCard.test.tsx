import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MOCK_AREAS } from "@/data/mock/areas";
import { AreaCard } from "./AreaCard";

describe("AreaCard", () => {
  it("지역명과 적합도 게이지를 표시하고 /area로 링크한다", () => {
    const area = MOCK_AREAS[0];
    render(
      <AreaCard
        area={area}
        fit={{ areaId: area.id, axisScores: {}, totalScore: 78 }}
      />,
    );
    expect(screen.getByRole("heading", { name: area.name })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "적합도 78점" })).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", `/area/${area.id}`);
  });
});

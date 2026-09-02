import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ScoreGauge } from "./ScoreGauge";

describe("ScoreGauge", () => {
  it("점수를 반올림해 표시한다", () => {
    render(<ScoreGauge score={62.4} />);
    expect(screen.getByText("62")).toBeInTheDocument();
  });

  it("접근성 라벨에 점수를 담는다", () => {
    render(<ScoreGauge score={80} />);
    expect(screen.getByRole("img", { name: "적합도 80점" })).toBeInTheDocument();
  });

  it("범위를 벗어난 값은 0~100으로 제한한다", () => {
    render(<ScoreGauge score={150} />);
    expect(screen.getByText("100")).toBeInTheDocument();
  });
});

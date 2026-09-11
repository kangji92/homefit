import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("서술형 상태 라벨을 렌더한다", () => {
    render(<StatusBadge status="recommended" />);
    expect(screen.getByText("조건이 잘 맞아요")).toBeInTheDocument();
  });

  it("blocked는 '현재 조건에선 어려워요'로 표시", () => {
    render(<StatusBadge status="blocked" />);
    expect(screen.getByText("현재 조건에선 어려워요")).toBeInTheDocument();
  });
});

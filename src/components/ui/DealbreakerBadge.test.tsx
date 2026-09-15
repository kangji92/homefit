import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DealbreakerBadge } from "./DealbreakerBadge";

describe("DealbreakerBadge", () => {
  it("기본 라벨 '조건 미충족'을 렌더한다", () => {
    render(<DealbreakerBadge />);
    expect(screen.getByText("조건 미충족")).toBeInTheDocument();
  });

  it("라벨을 덮어쓸 수 있다", () => {
    render(<DealbreakerBadge label="절대조건 미충족" />);
    expect(screen.getByText("절대조건 미충족")).toBeInTheDocument();
  });
});

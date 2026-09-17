import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FieldPropertyCTA } from "./FieldPropertyCTA";

describe("FieldPropertyCTA", () => {
  it("현장 매물 분석 흐름(/strategy?view=map)으로 연결된다", () => {
    render(<FieldPropertyCTA />);
    expect(screen.getByRole("link", { name: /현장에서 본 매물 분석하기/ })).toHaveAttribute(
      "href",
      "/strategy?view=map",
    );
  });

  it("description을 맥락별로 덮어쓸 수 있다", () => {
    render(<FieldPropertyCTA description="이 구역의 실제 매물을 입력해요." />);
    expect(screen.getByText("이 구역의 실제 매물을 입력해요.")).toBeInTheDocument();
  });
});

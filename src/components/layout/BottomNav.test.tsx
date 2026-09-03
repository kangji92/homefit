import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BottomNav } from "./BottomNav";

vi.mock("next/navigation", () => ({
  usePathname: () => "/candidates",
}));

describe("BottomNav", () => {
  it("5개 탭을 링크로 렌더링한다", () => {
    render(<BottomNav />);
    for (const name of ["홈", "탐색", "후보", "비교", "우리 조건"]) {
      expect(screen.getByRole("link", { name })).toBeInTheDocument();
    }
  });

  it("현재 경로에 해당하는 탭을 활성으로 표시한다", () => {
    render(<BottomNav />);
    expect(screen.getByRole("link", { name: "후보" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "홈" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});

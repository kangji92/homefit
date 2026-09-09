import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SchoolPanel } from "./SchoolPanel";

describe("SchoolPanel", () => {
  it("시군구 학교 현황(초/중/고)을 보여준다", () => {
    render(<SchoolPanel regionId="uiwang" />);
    expect(screen.getByText(/의왕시 학교 수/)).toBeInTheDocument();
    expect(screen.getAllByText("초등학교").length).toBeGreaterThan(0);
    // 통학구역 배정 안내 + 학구도 링크(오해 방지)
    expect(screen.getByText(/통학구역/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "학구도안내서비스" }),
    ).toHaveAttribute("href", "https://schoolzone.emac.kr/");
  });

  it("매핑 없는 region이면 렌더하지 않는다", () => {
    const { container } = render(<SchoolPanel regionId="presale-capital" />);
    expect(container).toBeEmptyDOMElement();
  });
});

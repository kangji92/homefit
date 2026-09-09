import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SchoolPanel } from "./SchoolPanel";

describe("SchoolPanel", () => {
  it("시군구 학교 현황(초/중/고)을 보여준다", () => {
    render(<SchoolPanel regionId="uiwang" />);
    expect(screen.getByText(/학군 · 의왕시/)).toBeInTheDocument();
    expect(screen.getAllByText("초등학교").length).toBeGreaterThan(0);
    expect(screen.getByText(/공공데이터/)).toBeInTheDocument();
  });

  it("매핑 없는 region이면 렌더하지 않는다", () => {
    const { container } = render(<SchoolPanel regionId="presale-capital" />);
    expect(container).toBeEmptyDOMElement();
  });
});

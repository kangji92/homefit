import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { REAL_DEVELOPMENTS } from "@/data/real/developments.anyang";
import { DevelopmentComparison } from "./DevelopmentComparison";

describe("DevelopmentComparison (동측/북측)", () => {
  it("두 사업을 같은 layout으로 나란히, 단계 차이를 보여준다", () => {
    render(<DevelopmentComparison areas={REAL_DEVELOPMENTS} />);
    expect(screen.getByText("종합운동장 동측일원 재개발")).toBeInTheDocument();
    expect(screen.getByText("종합운동장 북측 일원 재개발")).toBeInTheDocument();
    // 현재 단계 구분
    expect(screen.getByText("사업시행인가")).toBeInTheDocument(); // 동측
    expect(screen.getByText("조합설립 이후")).toBeInTheDocument(); // 북측
    // 진행정보 비교임을 명시(점수 아님)
    expect(screen.getByText(/투자점수·순위가 아니에요/)).toBeInTheDocument();
  });

  it("1건이면 렌더하지 않는다", () => {
    const { container } = render(<DevelopmentComparison areas={[REAL_DEVELOPMENTS[0]]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

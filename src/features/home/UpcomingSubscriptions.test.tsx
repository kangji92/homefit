import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MOCK_PRESALES } from "@/data/mock/presales";
import type { PresaleHome } from "@/domain/types";
import { UpcomingSubscriptions } from "./UpcomingSubscriptions";

describe("UpcomingSubscriptions", () => {
  it("단지명과 D-day를 표시하고 상세로 링크한다", () => {
    const home = MOCK_PRESALES[0];
    render(
      <UpcomingSubscriptions
        items={[{ home, date: "2026-10-15", dDay: 43 }]}
      />,
    );
    expect(screen.getByText(home.name)).toBeInTheDocument();
    expect(screen.getByText("D-43")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      `/complex/${home.id}`,
    );
  });

  it("과거 공고는 '마감'으로 표시한다", () => {
    render(
      <UpcomingSubscriptions
        items={[{ home: MOCK_PRESALES[0], date: "2026-08-01", dDay: -30 }]}
      />,
    );
    expect(screen.getByText("마감")).toBeInTheDocument();
  });

  it("무순위 등 청약 유형은 배지로 구분 표시한다(일반공급은 배지 없음)", () => {
    const unranked = { ...MOCK_PRESALES[0], subscription: { type: "unranked" as const } } as PresaleHome;
    render(<UpcomingSubscriptions items={[{ home: unranked, date: "2026-09-22", dDay: 4 }]} />);
    expect(screen.getByText("무순위")).toBeInTheDocument();
  });

  it("항목이 없으면 렌더하지 않는다", () => {
    const { container } = render(<UpcomingSubscriptions items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

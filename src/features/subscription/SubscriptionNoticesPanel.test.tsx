import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { SubscriptionNotice } from "@/domain/subscription";
import type { PresaleHome } from "@/domain/types";
import { SubscriptionNoticesPanel } from "./SubscriptionNoticesPanel";

const home = (id: string, name: string): PresaleHome =>
  ({ kind: "presale", id, name, regionId: "x", price: {}, sizesPyeong: [], commuteMinutes: {}, metrics: { education: 0, infrastructure: 0, environment: 0, futurePotential: 0 }, moveInYear: 2029 }) as PresaleHome;

describe("SubscriptionNoticesPanel", () => {
  it("종류 배지 + 단지명 + 공고일/D-day를 링크로 보여준다", () => {
    const notices: SubscriptionNotice[] = [
      { home: home("a", "A아파트"), date: "2026-09-25", dDay: 7, kind: "scheduled" },
      { home: home("b", "B아파트"), date: "2026-09-10", dDay: -8, kind: "new" },
    ];
    render(<SubscriptionNoticesPanel notices={notices} />);
    expect(screen.getByText("공고 예정")).toBeInTheDocument();
    expect(screen.getByText("신규")).toBeInTheDocument();
    expect(screen.getByText("A아파트")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /A아파트/ })).toHaveAttribute("href", "/complex/a");
  });

  it("소식이 없으면 렌더하지 않는다", () => {
    const { container } = render(<SubscriptionNoticesPanel notices={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

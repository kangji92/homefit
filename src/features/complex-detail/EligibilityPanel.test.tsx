import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EligibilityPanel } from "./EligibilityPanel";

describe("EligibilityPanel", () => {
  it("특별공급 전 유형(신혼·생애최초·다자녀·노부모·신생아)을 모두 판정한다", () => {
    render(<EligibilityPanel profile={{}} />);
    for (const name of ["신혼부부 특별공급", "생애최초 특별공급", "다자녀 특별공급", "노부모부양 특별공급", "신생아 특별공급"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it("미입력이면 '판정 전' + 프로필 링크", () => {
    render(<EligibilityPanel profile={{}} />);
    expect(screen.getAllByText("판정 전").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /가구 프로필 채우고/ })).toHaveAttribute("href", "/profile");
  });

  it("요건 충족 프로그램은 '가능성 있음'으로 표시", () => {
    render(
      <EligibilityPanel
        profile={{
          maritalStatus: "married",
          marriedMonths: 24,
          housingStatus: "none",
          householdSize: 3,
          dualIncome: true,
          monthlyIncomeManwon: 600,
          realEstateAssetManwon: 20000,
          carValueManwon: 2000,
          subscriptionMonths: 12,
        }}
      />,
    );
    expect(screen.getAllByText("가능성 있음").length).toBeGreaterThan(0);
  });

  it("사실혼이면 신혼 특공은 요건 미충족", () => {
    render(
      <EligibilityPanel
        profile={{
          maritalStatus: "de_facto",
          housingStatus: "none",
          householdSize: 3,
          dualIncome: true,
          monthlyIncomeManwon: 600,
          realEstateAssetManwon: 20000,
          carValueManwon: 2000,
          subscriptionMonths: 12,
        }}
      />,
    );
    expect(screen.getAllByText("요건 미충족").length).toBeGreaterThan(0);
  });
});

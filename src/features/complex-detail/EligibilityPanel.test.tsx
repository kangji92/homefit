import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EligibilityPanel } from "./EligibilityPanel";

describe("EligibilityPanel", () => {
  it("미입력이면 '판정 전' + 프로필 링크", () => {
    render(<EligibilityPanel profile={{}} />);
    expect(screen.getByText("판정 전")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /가구 프로필 채우고/ }),
    ).toHaveAttribute("href", "/profile");
  });

  it("모든 요건 충족이면 '가능성 있음'", () => {
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
    expect(screen.getByText("가능성 있음")).toBeInTheDocument();
  });

  it("사실혼이면 요건 미충족으로 표시된다", () => {
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
    expect(screen.getByText("요건 미충족")).toBeInTheDocument();
  });
});

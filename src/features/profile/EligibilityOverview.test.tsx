import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EligibilityOverview } from "./EligibilityOverview";
import type { HouseholdProfile } from "@/domain/types";

describe("EligibilityOverview", () => {
  it("자격되는 프로그램을 '지금 신청할 수 있는 청약'에 보여준다", () => {
    const profile: HouseholdProfile = {
      maritalStatus: "married",
      marriedMonths: 24,
      housingStatus: "none",
      minorChildren: 0,
      monthlyIncomeManwon: 600,
      totalAssetManwon: 20000,
      subscriptionMonths: 12,
    };
    render(<EligibilityOverview profile={profile} />);
    expect(screen.getByText(/신혼부부 특별공급/)).toBeInTheDocument();
  });

  it("사실혼·유주택이면 '이렇게 하면 열려요'에 복합 시나리오를 보여준다", () => {
    const profile: HouseholdProfile = {
      maritalStatus: "de_facto",
      housingStatus: "own",
      minorChildren: 0,
      monthlyIncomeManwon: 600,
      totalAssetManwon: 20000,
      subscriptionMonths: 12,
    };
    render(<EligibilityOverview profile={profile} />);
    expect(screen.getByText("이렇게 하면 열려요")).toBeInTheDocument();
    expect(screen.getByText("집 팔고 혼인신고하면")).toBeInTheDocument();
  });

  it("기준일·정책 버전 고지를 노출한다", () => {
    render(<EligibilityOverview profile={{}} />);
    expect(screen.getByText(/참고용 테스트 데이터/)).toBeInTheDocument();
  });
});

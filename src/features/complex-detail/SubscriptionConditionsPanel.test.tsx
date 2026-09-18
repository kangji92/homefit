import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { SubscriptionConditions } from "@/domain/types";
import { SubscriptionConditionsPanel } from "./SubscriptionConditionsPanel";

describe("SubscriptionConditionsPanel", () => {
  it("확인된 조건은 값으로, 미확인 수치는 '공고 확인'으로 정직 표기", () => {
    const c: SubscriptionConditions = {
      regulatedArea: "adjustment",
      homelessRequired: true,
      subscriptionAccount: { required: true, minMonths: 24 },
      localResidency: { required: true },
      rewinLimit: true,
      // resaleRestrictionMonths·mandatoryResidenceMonths 미확인
    };
    render(<SubscriptionConditionsPanel conditions={c} />);
    expect(screen.getByText("조정대상지역")).toBeInTheDocument();
    expect(screen.getByText("필요 · 24개월↑")).toBeInTheDocument();
    // 미확인 전매제한/실거주 → 공고 확인
    expect(screen.getAllByText("공고 확인").length).toBeGreaterThan(0);
  });

  it("무순위: 청약통장·거주요건 불필요, 재당첨 미적용", () => {
    const c: SubscriptionConditions = {
      homelessRequired: true,
      subscriptionAccount: { required: false },
      localResidency: { required: false },
      rewinLimit: false,
    };
    render(<SubscriptionConditionsPanel conditions={c} />);
    expect(screen.getAllByText("불필요").length).toBe(2);
    expect(screen.getByText("미적용")).toBeInTheDocument();
  });
});

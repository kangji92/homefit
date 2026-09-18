import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubscriptionGuideFeature } from "./SubscriptionGuideFeature";

describe("SubscriptionGuideFeature", () => {
  it("순위·통장, 특공 소득기준(공식 소득값), 자산, 출처를 안내한다", () => {
    render(<SubscriptionGuideFeature />);
    expect(screen.getByRole("heading", { name: "청약 자격 안내" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "특별공급 소득기준" })).toBeInTheDocument();
    // 정확화된 공식 소득값(3인 이하 753만) 노출
    expect(screen.getByText("753만")).toBeInTheDocument();
    // 특공 유형 안내
    expect(screen.getByText("신혼부부")).toBeInTheDocument();
    expect(screen.getByText("노부모부양")).toBeInTheDocument();
    // 출처/청약홈 링크
    expect(screen.getByRole("link", { name: "청약홈" })).toHaveAttribute("href", "https://www.applyhome.co.kr");
  });
});

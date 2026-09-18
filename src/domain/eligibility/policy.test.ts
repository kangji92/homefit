import { describe, it, expect } from "vitest";
import { DEFAULT_SUBSCRIPTION_POLICY as P } from "./policy";

describe("DEFAULT_SUBSCRIPTION_POLICY (청약홈 청약제도안내 2025 확인값)", () => {
  it("도시근로자 월평균소득 100% 공식값 — 3인이하 753·4인 880·5인 933만(만원)", () => {
    // ⚠️ 3인은 이전 817만 오류 → 공식 7,533,763원(753만)으로 정정.
    expect(P.urbanIncome100Manwon[3]).toBe(753);
    expect(P.urbanIncome100Manwon[4]).toBe(880);
    expect(P.urbanIncome100Manwon[5]).toBe(933);
    // 특공 '3인 이하' 브래킷: 1·2인도 3인 기준.
    expect(P.urbanIncome100Manwon[2]).toBe(753);
  });

  it("정책 버전·출처가 청약홈 청약제도안내(2025) 기준", () => {
    expect(P.asOf).toBe("2025");
    expect(P.source).toContain("청약홈 청약제도안내");
  });
});

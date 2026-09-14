import { describe, it, expect } from "vitest";
import type { DevelopmentPlan } from "./types";
import { planFieldComparison, planFieldsDiffer } from "./planComparison";

const official: DevelopmentPlan = {
  id: "p-official", type: "official", totalUnits: 1850, buildingCount: 16,
  sourceType: "official", sourceLabel: "공식 사업계획", verification: "verified",
};
const contractor: DevelopmentPlan = {
  id: "p-contractor", type: "contractor_proposal", totalUnits: 1850, buildingCount: 14, contractor: "○○건설",
  sourceType: "contractor", sourceLabel: "시공사 제안", verification: "reported",
};

describe("planFieldComparison", () => {
  it("필드별로 각 plan의 값+출처를 나란히 반환(합치지 않음)", () => {
    const bld = planFieldComparison([official, contractor], "buildingCount");
    expect(bld.map((v) => v.value)).toEqual([16, 14]);
    expect(bld.map((v) => v.sourceType)).toEqual(["official", "contractor"]);
    expect(planFieldsDiffer(bld)).toBe(true); // 16 ≠ 14 → 충돌(나란히 표시)
  });

  it("값이 같으면 충돌 아님", () => {
    const total = planFieldComparison([official, contractor], "totalUnits");
    expect(total.map((v) => v.value)).toEqual([1850, 1850]);
    expect(planFieldsDiffer(total)).toBe(false);
  });

  it("undefined 필드는 제외(임의 생성 안 함)", () => {
    const brand = planFieldComparison([official, contractor], "brand");
    expect(brand).toHaveLength(0);
    const contractorName = planFieldComparison([official, contractor], "contractor");
    expect(contractorName.map((v) => v.value)).toEqual(["○○건설"]); // official엔 없음
  });
});

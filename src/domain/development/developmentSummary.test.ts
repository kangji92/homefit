import { describe, it, expect } from "vitest";
import type { DevelopmentArea } from "./types";
import { developmentSummary } from "./developmentSummary";

const area: DevelopmentArea = {
  id: "a", name: "동측", developmentType: "redevelopment", stage: "in_progress",
  detailStage: "implementation", certainty: "confirmed", geometry: { kind: "point", at: { lat: 37.4, lng: 126.94 } },
  facts: { memberCount: 1374 },
  milestones: [
    { kind: "implementation", label: "사업시행계획인가", date: "2026-05-19", status: "confirmed" },
    { kind: "management", label: "관리처분(목표)", date: "2027", status: "target" },
  ],
  plans: [
    { id: "p1", type: "official", totalUnits: 1850, saleUnits: 1624, rentalUnits: 226, maxFloor: 35, buildingCount: 16, sourceType: "official" },
    { id: "p2", type: "contractor_proposal", buildingCount: 14, sourceType: "contractor" },
  ],
};

describe("developmentSummary", () => {
  it("공식 plan 우선으로 대표값 + facts 조합원 + 다음 target milestone", () => {
    const s = developmentSummary(area);
    expect(s.currentPhase).toBe("implementation");
    expect(s.totalUnits).toBe(1850);
    expect(s.saleUnits).toBe(1624); // 분양(≠일반분양)
    expect(s.memberCount).toBe(1374);
    expect(s.maxFloor).toBe(35);
    expect(s.nextTarget?.date).toBe("2027");
    expect(s.nextTarget?.label).toContain("관리처분");
  });
});

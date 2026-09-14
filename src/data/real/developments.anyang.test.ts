import { describe, it, expect } from "vitest";
import { getRealDevelopment, REAL_DEVELOPMENTS } from "./developments.anyang";

describe("REAL 안양 재개발 fixture (official-backed)", () => {
  const east = getRealDevelopment("dev-anyang-stadium-east")!;
  const north = getRealDevelopment("dev-anyang-stadium-north")!;

  it("동측/북측 진행 단계 구분(혼동 금지)", () => {
    expect(east.detailStage).toBe("implementation"); // 사업시행인가 완료
    expect(north.detailStage).toBe("association"); // 조합설립 완료·사업시행 예정
    expect(north.stage).toBe("approved");
  });

  it("동측 동수는 공식 16 vs 시공사 14로 병존(합치지 않음)", () => {
    const bld = east.plans!.filter((p) => p.buildingCount != null).map((p) => p.buildingCount);
    expect(bld).toContain(16);
    expect(bld).toContain(14);
  });

  it("분양(saleUnits)만 있고 일반분양(generalSaleUnits)은 미확인→undefined", () => {
    const eastOfficial = east.plans!.find((p) => p.id === "east-official-current")!;
    expect(eastOfficial.saleUnits).toBe(1624);
    expect(eastOfficial.generalSaleUnits).toBeUndefined();
    const northOfficial = north.plans![0];
    expect(northOfficial.saleUnits).toBe(1132);
    expect(northOfficial.generalSaleUnits).toBeUndefined();
  });

  it("사업시행인가는 동측=확정 / 북측=목표(target)", () => {
    const eastImpl = east.milestones!.find((m) => m.kind === "implementation")!;
    expect(eastImpl.status).toBe("confirmed");
    const northImpl = north.milestones!.find((m) => m.kind === "implementation")!;
    expect(northImpl.status).toBe("target");
  });

  it("경계 미확보 → centroid_only(공식 GIS 아님)", () => {
    expect(east.geometryAccuracy).toBe("centroid_only");
    expect(north.geometryAccuracy).toBe("centroid_only");
  });

  it("북측 공식 현황 facts", () => {
    expect(north.facts?.siteAreaM2).toBe(64375.3);
    expect(north.facts?.memberCount).toBe(911);
    expect(REAL_DEVELOPMENTS).toHaveLength(2);
  });
});

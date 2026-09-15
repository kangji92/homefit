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

  it("[보정1] 사업시행인가일은 official/verified (안양시 공식 추진경위)", () => {
    const impl = east.milestones!.find((m) => m.kind === "implementation")!;
    expect(impl.sourceType).toBe("official");
    expect(impl.verification).toBe("verified");
  });

  it("[보정2] 건폐율/용적률을 버리지 않고 계획안별로 보존(현행 267.4 vs 최초 280)", () => {
    const current = east.plans!.find((p) => p.id === "east-official-current")!;
    const initial = east.plans!.find((p) => p.id === "east-designation-initial")!;
    expect(current.floorAreaRatioMax).toBe(267.4);
    expect(current.buildingCoverageRatioMax).toBe(30);
    expect(initial.floorAreaRatioMax).toBe(280);
  });

  it("[보정3] 조합원 예정분양가는 broker/미확인(공식 승격 금지), 근거 있는 평형만 가격", () => {
    const est = east.memberSaleEstimates!.find((e) => e.id === "east-84")!;
    expect(est.sizeLabel).toBe("84㎡");
    expect(est.sourceType).toBe("broker");
    expect(est.verification).toBe("unverified");
    expect(est.price!.min.manwon).toBe(110000);
    expect(est.price!.max.manwon).toBe(115000);
    // 근거 없는 평형은 price 미기입(예정가 미확보) — 임의 추정 금지.
    const noPrice = east.memberSaleEstimates!.find((e) => e.id === "east-59")!;
    expect(noPrice.price).toBeUndefined();
    // 안정적 참조 id를 모든 평형이 가진다(희망 평형 저장·복원용).
    expect(east.memberSaleEstimates!.every((e) => typeof e.id === "string" && e.id.length > 0)).toBe(true);
  });

  it("경계는 공식 NSDI SHP 좌표(official_boundary, 수도권 범위)", () => {
    expect(east.geometry.kind).toBe("polygon");
    expect(east.geometryAccuracy).toBe("official_boundary");
    expect(north.geometryAccuracy).toBe("official_boundary");
    if (east.geometry.kind === "polygon") {
      const ring = east.geometry.rings[0];
      expect(ring.length).toBeGreaterThan(50); // 실 경계는 다수 정점
      // 변환 좌표가 안양 종합운동장 일대(수도권)에 위치
      expect(ring[0].lat).toBeGreaterThan(37.39);
      expect(ring[0].lat).toBeLessThan(37.42);
      expect(ring[0].lng).toBeGreaterThan(126.93);
      expect(ring[0].lng).toBeLessThan(126.97);
    }
  });

  it("북측 공식 현황 facts", () => {
    expect(north.facts?.siteAreaM2).toBe(64375.3);
    expect(north.facts?.memberCount).toBe(911);
    // 동측/북측 + 추가 안양 구역들이 함께 병합돼 있다.
    const ids = REAL_DEVELOPMENTS.map((d) => d.id);
    expect(ids).toContain("dev-anyang-stadium-east");
    expect(ids).toContain("dev-anyang-stadium-north");
    expect(REAL_DEVELOPMENTS.length).toBeGreaterThanOrEqual(2);
  });
});

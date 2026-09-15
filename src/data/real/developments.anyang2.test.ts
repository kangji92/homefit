import { describe, it, expect } from "vitest";
import { REAL_DEVELOPMENTS_ANYANG_MORE } from "./developments.anyang2";
import { REAL_DEVELOPMENTS, getRealDevelopment } from "./developments.anyang";

describe("안양 정비사업 구역 추가분(종합운동장 외)", () => {
  it("공식 경계(official_boundary) + polygon을 가진 실구역들을 담는다", () => {
    for (const d of REAL_DEVELOPMENTS_ANYANG_MORE) {
      expect(d.geometryAccuracy).toBe("official_boundary");
      expect(d.geometry.kind).toBe("polygon");
      if (d.geometry.kind === "polygon") expect(d.geometry.rings[0].length).toBeGreaterThan(2);
      expect(d.facts?.siteAreaM2).toBeGreaterThan(0);
    }
  });

  it("REAL_DEVELOPMENTS에 종합운동장 동측/북측 + 추가분이 모두 병합된다", () => {
    const ids = REAL_DEVELOPMENTS.map((d) => d.id);
    expect(ids).toContain("dev-anyang-stadium-east");
    expect(ids).toContain("dev-anyang-yeoksegwon");
    expect(ids).toContain("dev-anyang-newtown-samho");
    expect(getRealDevelopment("dev-anyang-gwanyang-hyundai")?.name).toContain("관양동 현대아파트");
  });

  it("단계 미확인 구역은 임의 추정 없이 certainty로 정직 표기 + 공식 지정 milestone만", () => {
    const bisan = getRealDevelopment("dev-anyang-bisan-school");
    expect(bisan?.certainty).toBe("uncertain");
    // 시공사 계획은 지어내지 않는다.
    expect(bisan?.plans).toBeUndefined();
    // milestone은 공식(SHP) 지정고시 하나만 — 진행단계는 추정하지 않는다.
    expect(bisan?.milestones).toHaveLength(1);
    expect(bisan?.milestones?.[0].kind).toBe("designation");
    expect(bisan?.milestones?.[0].sourceType).toBe("official");
    expect(bisan?.milestones?.[0].verification).toBe("verified");
  });

  it("SHP DBF의 공식 고시일(NTFDATE)을 지정 milestone으로 쓴다", () => {
    const yeok = getRealDevelopment("dev-anyang-yeoksegwon");
    const desig = yeok?.milestones?.find((m) => m.kind === "designation");
    expect(desig?.date).toBe("2015-08-07"); // NTFDATE 공식
    expect(desig?.sourceType).toBe("official");
  });
});

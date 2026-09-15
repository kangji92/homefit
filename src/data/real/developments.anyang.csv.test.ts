import { describe, it, expect } from "vitest";
import { ANYANG_DEVELOPMENTS_CSV } from "./developments.anyang.csv";
import { REAL_DEVELOPMENTS, getRealDevelopment } from "./developments.anyang";

describe("안양 정비사업(공공데이터 공식 CSV 생성본)", () => {
  it("모든 항목이 공식(verified) + 위치 geometry를 가진다", () => {
    expect(ANYANG_DEVELOPMENTS_CSV.length).toBeGreaterThan(10);
    for (const d of ANYANG_DEVELOPMENTS_CSV) {
      expect(d.verification).toBe("verified");
      expect(["official_boundary", "centroid_only"]).toContain(d.geometryAccuracy);
    }
  });

  it("SHP 경계 확보 6곳은 official_boundary(polygon), 나머지는 centroid_only(point)", () => {
    const yeok = getRealDevelopment("dev-anyang-yeoksegwon");
    expect(yeok?.geometryAccuracy).toBe("official_boundary");
    expect(yeok?.geometry.kind).toBe("polygon");
    const centroidOnly = ANYANG_DEVELOPMENTS_CSV.filter((d) => d.geometryAccuracy === "centroid_only");
    expect(centroidOnly.every((d) => d.geometry.kind === "point")).toBe(true);
  });

  it("공식 인가일자를 milestone(official)으로 반영한다", () => {
    const gwanyang = getRealDevelopment("dev-anyang-gwanyang-hyundai");
    const desig = gwanyang?.milestones?.find((m) => m.kind === "designation");
    expect(desig?.date).toBe("2020-09-22"); // 공식 정비구역 지정일
    expect(desig?.sourceType).toBe("official");
    expect(gwanyang?.facts?.memberCount).toBe(956); // 공식 조합원수
  });

  it("[보정] 추정으로 '미확인'이던 호계온천/비산초교는 공식상 착공·준공 단계였다", () => {
    // 이전엔 certainty=uncertain(초기)로 잘못 넣었던 것을 공식 단계로 교정.
    expect(getRealDevelopment("dev-anyang-hogye-oncheon")?.stage).toBe("completed");
    expect(getRealDevelopment("dev-anyang-bisan-school")?.stage).toBe("completed");
  });

  it("REAL_DEVELOPMENTS에 동측/북측 + 공식 CSV 구역이 병합된다", () => {
    const ids = REAL_DEVELOPMENTS.map((d) => d.id);
    expect(ids).toContain("dev-anyang-stadium-east");
    expect(ids).toContain("dev-anyang-yeoksegwon");
    expect(REAL_DEVELOPMENTS.length).toBe(2 + ANYANG_DEVELOPMENTS_CSV.length);
  });
});

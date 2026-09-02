import { describe, it, expect } from "vitest";
import {
  mapComplex,
  mapRegion,
  type ComplexRow,
  type RegionRow,
} from "./supabase";

describe("mapRegion", () => {
  it("행을 Region 도메인 타입으로 변환한다", () => {
    const row: RegionRow = { id: "misa", name: "미사강변도시", summary: "요약" };
    expect(mapRegion(row)).toEqual({
      id: "misa",
      name: "미사강변도시",
      summary: "요약",
    });
  });

  it("summary가 null이면 키를 넣지 않는다", () => {
    const row: RegionRow = { id: "x", name: "무요약", summary: null };
    expect(mapRegion(row)).toEqual({ id: "x", name: "무요약" });
    expect("summary" in mapRegion(row)).toBe(false);
  });
});

describe("mapComplex", () => {
  const row: ComplexRow = {
    id: "misa-central",
    region_id: "misa",
    name: "미사강변센트럴",
    price: {
      sale: { representative: 85000, min: 80000, max: 95000 },
      jeonse: { representative: 53000, min: 50000, max: 59000 },
    },
    sizes_pyeong: [25, 34],
    completion_year: 2018,
    households: 1100,
    station_distance_m: 400,
    commute_minutes: { gangnam: 40, pangyo: 55 },
    metrics: {
      education: 78,
      infrastructure: 82,
      environment: 76,
      futurePotential: 70,
    },
    school_nearby: true,
    images: null,
  };

  it("snake_case 행을 camelCase Complex로 매핑한다", () => {
    expect(mapComplex(row)).toEqual({
      id: "misa-central",
      kind: "existing",
      name: "미사강변센트럴",
      regionId: "misa",
      price: row.price,
      sizesPyeong: [25, 34],
      completionYear: 2018,
      households: 1100,
      stationDistanceM: 400,
      commuteMinutes: { gangnam: 40, pangyo: 55 },
      metrics: row.metrics,
      schoolNearby: true,
    });
  });

  it("nullable 필드(images/school_nearby)가 null이면 키를 생략한다", () => {
    const bare = mapComplex({ ...row, school_nearby: null, images: null });
    expect("images" in bare).toBe(false);
    expect("schoolNearby" in bare).toBe(false);
  });
});

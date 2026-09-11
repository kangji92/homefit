import { describe, it, expect } from "vitest";
import { isPlausibleMetroLocation } from "@/data/geo";
import { MOCK_LOCATIONS, withMockLocation } from "./coordinates";

describe("MOCK_LOCATIONS 큐레이션 좌표", () => {
  it("모든 좌표가 수도권 bounding box 안(좌표계 혼동/오타 방지)", () => {
    for (const [id, m] of Object.entries(MOCK_LOCATIONS)) {
      expect(isPlausibleMetroLocation(m.location), id).toBe(true);
    }
  });

  it("기존 단지는 accuracy=complex, 개발지는 area, presale은 area", () => {
    expect(MOCK_LOCATIONS["pyeongchon-urbaine"].accuracy).toBe("complex");
    expect(MOCK_LOCATIONS["area-gyosan"].accuracy).toBe("area");
    expect(MOCK_LOCATIONS["presale-uiwang-hanshin"].accuracy).toBe("area");
  });
});

describe("withMockLocation", () => {
  it("id가 매칭되면 location·locationAccuracy를 붙인다", () => {
    const out = withMockLocation({ id: "area-gyosan" });
    expect(out.location).toEqual({ lat: 37.52453, lng: 127.20301 });
    expect(out.locationAccuracy).toBe("area");
  });
  it("이미 location이 있으면 덮지 않는다", () => {
    const out = withMockLocation({ id: "area-gyosan", location: { lat: 1, lng: 2 } });
    expect(out.location).toEqual({ lat: 1, lng: 2 });
  });
  it("매칭 없으면 원본 그대로(degraded)", () => {
    const out = withMockLocation({ id: "unknown-x" });
    expect(out.location).toBeUndefined();
  });
});

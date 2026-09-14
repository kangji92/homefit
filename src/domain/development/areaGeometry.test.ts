import { describe, it, expect } from "vitest";
import { approximateSquarePolygon, polygonCentroid } from "./areaGeometry";

describe("approximateSquarePolygon", () => {
  const center = { lat: 37.4009, lng: 126.945 };
  const poly = approximateSquarePolygon(center, 91267); // 동측 면적

  it("polygon 4점, 중심은 입력 center 근처", () => {
    expect(poly.kind).toBe("polygon");
    expect(poly.rings[0]).toHaveLength(4);
    const c = polygonCentroid(poly)!;
    expect(c.lat).toBeCloseTo(center.lat, 4);
    expect(c.lng).toBeCloseTo(center.lng, 4);
  });

  it("한 변 길이 ≈ sqrt(면적) (91,267㎡ → ~302m)", () => {
    const ring = poly.rings[0];
    const dLatDeg = ring[0].lat - ring[3].lat; // NW - SW
    const sideM = dLatDeg * 111_320;
    expect(sideM).toBeGreaterThan(295);
    expect(sideM).toBeLessThan(310);
  });

  it("면적이 클수록 큰 사각형", () => {
    const small = approximateSquarePolygon(center, 10000);
    const big = approximateSquarePolygon(center, 90000);
    const span = (p: typeof small) => p.rings[0][0].lat - p.rings[0][3].lat;
    expect(span(big)).toBeGreaterThan(span(small));
  });
});

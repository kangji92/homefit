import { describe, it, expect } from "vitest";
import { isPlausibleMetroLocation } from "./geo";

describe("isPlausibleMetroLocation", () => {
  it("수도권 좌표는 통과(안양 근처)", () => {
    expect(isPlausibleMetroLocation({ lat: 37.39, lng: 126.95 })).toBe(true);
  });
  it("범위 밖(제주)은 거부", () => {
    expect(isPlausibleMetroLocation({ lat: 33.4, lng: 126.5 })).toBe(false);
  });
  it("좌표계 혼동(EPSG:5179 큰 수)은 거부", () => {
    expect(isPlausibleMetroLocation({ lat: 195000, lng: 450000 })).toBe(false);
  });
  it("NaN 거부", () => {
    expect(isPlausibleMetroLocation({ lat: NaN, lng: 127 })).toBe(false);
  });
});

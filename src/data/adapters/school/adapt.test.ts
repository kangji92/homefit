import { describe, it, expect } from "vitest";
import {
  aggregateBySigungu,
  nearestByLevel,
  sigunguKey,
  type SchoolRaw,
} from "./adapt";

describe("sigunguKey", () => {
  it("시도 다음 시/군/구 토큰을 뽑는다", () => {
    expect(sigunguKey("경기도 의왕시 청계동 1")).toBe("의왕시");
    expect(sigunguKey("서울특별시 동대문구 전농동 90")).toBe("동대문구");
    expect(sigunguKey("경기도 안양시 동안구 관양동")).toBe("안양시");
  });
  it("주소 없으면 undefined", () => {
    expect(sigunguKey(undefined)).toBeUndefined();
  });
});

describe("aggregateBySigungu", () => {
  const rows: SchoolRaw[] = [
    { schoolNm: "의왕초", schoolSe: "초등학교", lnmadr: "경기도 의왕시 A", latitude: "37.34", longitude: "126.97" },
    { schoolNm: "내손초", schoolSe: "초등학교", lnmadr: "경기도 의왕시 B", latitude: "37.35", longitude: "126.98" },
    { schoolNm: "의왕중", schoolSe: "중학교", lnmadr: "경기도 의왕시 C", latitude: "37.34", longitude: "126.97" },
    { schoolNm: "안양고", schoolSe: "고등학교", lnmadr: "경기도 안양시 D", latitude: "37.39", longitude: "126.93" },
    { schoolNm: "특수", schoolSe: "특수학교", lnmadr: "경기도 의왕시 E" }, // 제외
  ];
  it("시군구·급별로 집계하고 이름을 담는다", () => {
    const agg = aggregateBySigungu(rows);
    expect(agg["의왕시"].elementary).toBe(2);
    expect(agg["의왕시"].middle).toBe(1);
    expect(agg["의왕시"].high).toBe(0);
    expect(agg["의왕시"].names.elementary).toContain("내손초");
    expect(agg["안양시"].high).toBe(1);
  });
  it("초/중/고가 아닌 급은 제외", () => {
    const agg = aggregateBySigungu(rows);
    const total = agg["의왕시"].elementary + agg["의왕시"].middle + agg["의왕시"].high;
    expect(total).toBe(3); // 특수학교 제외
  });

  it("좌표가 있는 학교는 points에 담긴다", () => {
    const agg = aggregateBySigungu(rows);
    expect(agg["의왕시"].points.length).toBe(3); // 의왕 초2·중1(좌표 있음)
  });
});

describe("nearestByLevel", () => {
  it("좌표에서 급별 가장 가까운 학교를 고른다", () => {
    const pts = aggregateBySigungu([
      { schoolNm: "가까운초", schoolSe: "초등학교", lnmadr: "경기도 의왕시", latitude: "37.341", longitude: "126.971" },
      { schoolNm: "먼초", schoolSe: "초등학교", lnmadr: "경기도 의왕시", latitude: "37.50", longitude: "127.10" },
    ])["의왕시"].points;
    const near = nearestByLevel({ la: 37.34, lo: 126.97 }, pts);
    expect(near.elementary?.nm).toBe("가까운초");
  });
});

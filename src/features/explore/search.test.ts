import { describe, it, expect } from "vitest";
import { makeComplex, makeConditions, WORKED_PRIORITIES } from "@/domain/__fixtures__";
import type { Area, Home } from "@/domain/types";
import { searchListings, type SearchParams, type SearchContext } from "./search";

const homeA: Home = makeComplex({
  id: "a",
  name: "미사강변 자이",
  regionId: "capital",
  price: { sale: { representative: 60000 }, jeonse: { representative: 40000 } },
  sizesPyeong: [25, 32],
  completionYear: 2018,
});
const homeB: Home = makeComplex({
  id: "b",
  name: "동탄 파크뷰",
  regionId: "east",
  price: { sale: { representative: 90000 }, jeonse: { representative: 55000 } },
  sizesPyeong: [34, 45],
  completionYear: 2022,
});
const presaleC: Home = {
  id: "c",
  name: "검단 신혼분양",
  regionId: "capital",
  kind: "presale",
  price: { sale: { representative: 70000 } },
  sizesPyeong: [30],
  commuteMinutes: { a: 35, b: 45 },
  metrics: { education: 60, infrastructure: 60, environment: 60, futurePotential: 80 },
  moveInYear: 2028,
};
const areaX: Area = {
  kind: "area",
  id: "x",
  name: "왕숙 신도시",
  regionId: "capital",
  areaMetrics: { plannedInfra: 80, transitPlan: 70, supply: 90, futurePotential: 85, environment: 60 },
  targetMoveInYear: 2029,
};

const HOMES = [homeA, homeB, presaleC];
const AREAS = [areaX];

const baseParams: SearchParams = {
  q: "",
  regionId: "all",
  dealType: "sale",
  kind: "all",
  sort: "fit",
};

const ctx: SearchContext = {
  conditions: makeConditions(),
  priorities: WORKED_PRIORITIES,
  dealbreakers: {},
};

function run(p: Partial<SearchParams>, c: SearchContext = ctx) {
  return searchListings(HOMES, AREAS, { ...baseParams, ...p }, c);
}

describe("searchListings", () => {
  it("이름으로 부분일치 검색(대소문자·공백 무시)", () => {
    const r = run({ q: " 동탄 " });
    expect(r.homes.map((h) => h.complex.id)).toEqual(["b"]);
    expect(r.areas).toHaveLength(0);
  });

  it("지역 필터는 집·지역 공통", () => {
    const r = run({ regionId: "capital" });
    expect(r.homes.map((h) => h.complex.id).sort()).toEqual(["a", "c"]);
    expect(r.areas.map((a) => a.area.id)).toEqual(["x"]);
  });

  it("유형 필터 — 분양만", () => {
    const r = run({ kind: "presale" });
    expect(r.homes.map((h) => h.complex.id)).toEqual(["c"]);
    expect(r.areas).toHaveLength(0);
  });

  it("유형 필터 — 개발예정지만", () => {
    const r = run({ kind: "area" });
    expect(r.homes).toHaveLength(0);
    expect(r.areas.map((a) => a.area.id)).toEqual(["x"]);
  });

  it("가격 상한은 집에만 적용, 대표가 초과분 제외", () => {
    const r = run({ priceMax: 65000 });
    // a(60000) 통과, b(90000)·c(70000) 제외
    expect(r.homes.map((h) => h.complex.id)).toEqual(["a"]);
  });

  it("가격 필터는 개발예정지를 거르지 않는다", () => {
    const r = run({ priceMax: 1, kind: "all" });
    expect(r.areas.map((a) => a.area.id)).toEqual(["x"]);
  });

  it("해당 거래유형 매물이 없으면(전세 미제공) 가격 초과로 보지 않고 통과", () => {
    // presaleC는 jeonse 밴드 없음 → 전세 + priceMax여도 제외되지 않음
    const r = run({ dealType: "jeonse", priceMax: 45000, kind: "presale" });
    expect(r.homes.map((h) => h.complex.id)).toEqual(["c"]);
  });

  it("최소 평형 필터(최대 평형 기준)", () => {
    const r = run({ sizeMin: 40 });
    // a(max32) 제외, b(max45) 통과, c(max30) 제외
    expect(r.homes.map((h) => h.complex.id)).toEqual(["b"]);
  });

  it("가격순 정렬(오름차순)", () => {
    const r = run({ sort: "price" });
    expect(r.homes.map((h) => h.complex.id)).toEqual(["a", "c", "b"]);
  });

  it("최신순 정렬(준공/입주 연도 내림차순)", () => {
    const r = run({ sort: "newest" });
    expect(r.homes.map((h) => h.complex.id)).toEqual(["c", "b", "a"]);
  });

  it("적합도순은 dealbreaker 통과분을 먼저, 불충족도 목록에 유지", () => {
    const c: SearchContext = { ...ctx, dealbreakers: { maxPrice: 85000 } };
    const r = run({ sort: "fit" }, c);
    // b(90000)는 탈락이지만 제외되지 않고 맨 뒤
    expect(r.homes.map((h) => h.complex.id)).toContain("b");
    expect(r.homes[r.homes.length - 1].complex.id).toBe("b");
    expect(r.homes[r.homes.length - 1].fit.passesDealbreakers).toBe(false);
  });
});

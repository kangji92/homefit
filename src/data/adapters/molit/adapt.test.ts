import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { parseTradeItems, parseRentItems } from "./parse";
import {
  parseAmountManwon,
  toSalePriceBand,
  toJeonsePriceBand,
} from "./adapt";

const saleXml = readFileSync(
  "src/data/adapters/molit/__fixtures__/misa_sale.xml",
  "utf-8",
);
const rentXml = readFileSync(
  "src/data/adapters/molit/__fixtures__/misa_rent.xml",
  "utf-8",
);
const APT = "미사강변센트럴자이";

describe("parseAmountManwon", () => {
  it("콤마·공백을 제거해 숫자로", () => {
    expect(parseAmountManwon(" 90,000")).toBe(90000);
    expect(parseAmountManwon("100,000")).toBe(100000);
  });
  it("이상값은 null", () => {
    expect(parseAmountManwon("")).toBeNull();
    expect(parseAmountManwon("abc")).toBeNull();
    expect(parseAmountManwon(undefined)).toBeNull();
  });
});

describe("toSalePriceBand", () => {
  const items = parseTradeItems(saleXml);

  it("대표가=중앙값, min/max=범위, 다른 단지는 제외", () => {
    // 대상: 90000,100000,95000 → median 95000. 리버뷰(120000)는 제외.
    expect(toSalePriceBand(items, { asOfYm: 202406, aptName: APT })).toEqual({
      representative: 95000,
      min: 90000,
      max: 100000,
    });
  });

  it("최근 창이 비면 12개월로 확장한다", () => {
    // 202412 기준 최근 6개월(202407~202412)엔 거래 없음 → 12개월 폴백
    expect(toSalePriceBand(items, { asOfYm: 202412, aptName: APT })).toEqual({
      representative: 95000,
      min: 90000,
      max: 100000,
    });
  });

  it("매칭 단지가 없으면 undefined", () => {
    expect(
      toSalePriceBand(items, { asOfYm: 202406, aptName: "없는아파트" }),
    ).toBeUndefined();
  });
});

describe("toJeonsePriceBand", () => {
  const items = parseRentItems(rentXml);

  it("순수 전세(월세0)만, 대표=중앙값", () => {
    // 전세 55000,50000 → median 52500. 월세건(30000/80)·리버뷰 제외.
    expect(toJeonsePriceBand(items, { asOfYm: 202406, aptName: APT })).toEqual({
      representative: 52500,
      min: 50000,
      max: 55000,
    });
  });
});

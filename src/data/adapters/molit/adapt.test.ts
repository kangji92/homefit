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
    // 실거래(2025-06) 22건 중앙값 13.65억. 디코이 단지는 제외.
    expect(toSalePriceBand(items, { asOfYm: 202506, aptName: APT })).toEqual({
      representative: 136500,
      min: 125000,
      max: 147000,
    });
  });

  it("최근 창이 비면 12개월로 확장한다", () => {
    // 202512 기준 최근 6개월(202507~202512)엔 거래 없음 → 12개월 폴백(202506 포함)
    expect(toSalePriceBand(items, { asOfYm: 202512, aptName: APT })).toEqual({
      representative: 136500,
      min: 125000,
      max: 147000,
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
    // 실거래(2025-06) 순수 전세 9건 중앙값 7.8억. 월세건·디코이 제외.
    expect(toJeonsePriceBand(items, { asOfYm: 202506, aptName: APT })).toEqual({
      representative: 78000,
      min: 60900,
      max: 83000,
    });
  });
});

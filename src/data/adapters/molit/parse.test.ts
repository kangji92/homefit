import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { parseTradeItems } from "./parse";

const saleXml = readFileSync(
  "src/data/adapters/molit/__fixtures__/misa_sale.xml",
  "utf-8",
);

describe("parseItems", () => {
  it("<item> 블록을 태그 맵으로 추출한다", () => {
    const items = parseTradeItems(saleXml);
    // 실데이터 fixture: 대상 22건 + 디코이 2건
    expect(items).toHaveLength(24);
    expect(items[0].aptNm).toBe("미사강변센트럴자이");
    expect(items[0].dealYear).toBe("2025");
    expect(items[0].dealAmount).toMatch(/^[\d,]+$/); // "134,800" 형태
  });
});

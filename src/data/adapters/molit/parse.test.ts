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
    expect(items).toHaveLength(4);
    expect(items[0].aptNm).toBe("미사강변센트럴자이");
    expect(items[0].dealAmount).toBe("90,000"); // trim으로 앞 공백 제거
    expect(items[0].dealYear).toBe("2024");
  });
});

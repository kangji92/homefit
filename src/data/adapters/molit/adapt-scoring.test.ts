import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { computeFit } from "@/domain/scoring";
import { makeConditions } from "@/domain/__fixtures__";
import { MOCK_COMPLEXES } from "@/data/mock/complexes";
import type { Priorities } from "@/domain/types";
import { parseTradeItems, parseRentItems } from "./parse";
import { toSalePriceBand, toJeonsePriceBand } from "./adapt";

// fixture → adapter → computeFit 까지 관통하는 scoring 영향 검증.
const saleXml = readFileSync(
  "src/data/adapters/molit/__fixtures__/misa_sale.xml",
  "utf-8",
);
const rentXml = readFileSync(
  "src/data/adapters/molit/__fixtures__/misa_rent.xml",
  "utf-8",
);

const PRIORITIES: Priorities = {
  price: 50, commute: 50, education: 50, newness: 50,
  infrastructure: 50, environment: 50, futurePotential: 50,
};

describe("실거래가 → scoring 영향", () => {
  it("실거래 대표가가 mock보다 비싸면 가격 점수가 내려간다", () => {
    const conditions = makeConditions(); // dealType sale, 예산 100000, 보유 50000
    const complex = MOCK_COMPLEXES.find((c) => c.id === "misa-central")!;
    const opts = { asOfYm: 202406, aptName: "미사강변센트럴자이" };

    const sale = toSalePriceBand(parseTradeItems(saleXml), opts);
    const jeonse = toJeonsePriceBand(parseRentItems(rentXml), opts);
    expect(sale?.representative).toBe(95000); // adapter 산출 확인

    const real = { ...complex, price: { sale, jeonse } };

    const before = computeFit(conditions, PRIORITIES, {}, complex); // mock 85000
    const after = computeFit(conditions, PRIORITIES, {}, real); // real 95000

    // 실거래가↑ → 가격 축·총점 하락 (스코어링이 실데이터에 반응)
    expect(after.axisScores.price).toBeLessThan(before.axisScores.price);
    expect(after.totalScore).toBeLessThan(before.totalScore);
  });
});

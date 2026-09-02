// Phase 2-1 실거래가 PoC 러너 (fixture 기반, 키 불필요).
// 조회(fixture) → adapter 정규화 → override(pocPriceOverride.ts) 재생성.
// scoring 영향 검증은 vitest(adapt-scoring.test.ts)에서 자동화한다.
// 실행: pnpm poc:tx   (node --experimental-strip-types)
// (docs/design/data-phase2-1-transactions-poc.md §5)

import { readFileSync, writeFileSync } from "node:fs";
import { parseTradeItems, parseRentItems } from "../src/data/adapters/molit/parse.ts";
import { toSalePriceBand, toJeonsePriceBand } from "../src/data/adapters/molit/adapt.ts";
import { MOLIT_SOURCES } from "../src/data/adapters/molit/sources.ts";

// PoC 단지별 fixture + 기준월 (실서비스에선 client.ts 라이브 조회로 대체)
const FIXTURES: Record<string, { sale: string; rent: string; asOfYm: number }> = {
  "misa-central": { sale: "misa_sale.xml", rent: "misa_rent.xml", asOfYm: 202406 },
};

const FIX_DIR = "../src/data/adapters/molit/__fixtures__/";
const read = (f: string) =>
  readFileSync(new URL(FIX_DIR + f, import.meta.url), "utf-8");

function fmtBand(b) {
  if (!b) return "undefined";
  const parts = [`representative: ${b.representative}`];
  if (b.min != null) parts.push(`min: ${b.min}`);
  if (b.max != null) parts.push(`max: ${b.max}`);
  return `{ ${parts.join(", ")} }`;
}

const override: Record<string, { sale?: unknown; jeonse?: unknown }> = {};

for (const src of MOLIT_SOURCES) {
  const fx = FIXTURES[src.complexId];
  if (!fx) {
    console.log(`- ${src.complexId}: fixture 없음 → 스킵(확대 대상)`);
    continue;
  }
  const opts = { asOfYm: fx.asOfYm, aptName: src.aptName };
  const sale = toSalePriceBand(parseTradeItems(read(fx.sale)), opts);
  const jeonse = toJeonsePriceBand(parseRentItems(read(fx.rent)), opts);
  const price: { sale?: unknown; jeonse?: unknown } = {};
  if (sale) price.sale = sale;
  if (jeonse) price.jeonse = jeonse;
  override[src.complexId] = price;

  console.log(`\n■ ${src.complexId} (${src.aptName}, LAWD_CD ${src.lawdCd})`);
  console.log(`  매매 실거래 대표가: ${fmtBand(sale)}`);
  console.log(`  전세 실거래 대표가: ${fmtBand(jeonse)}`);
}

// override 파일 생성
const body = Object.entries(override)
  .map(([id, price]) => {
    const lines: string[] = [];
    if (price.sale) lines.push(`    sale: ${fmtBand(price.sale)},`);
    if (price.jeonse) lines.push(`    jeonse: ${fmtBand(price.jeonse)},`);
    return `  "${id}": {\n${lines.join("\n")}\n  },`;
  })
  .join("\n");

const content = `import type { ComplexPrice } from "@/domain/types";

// PoC 생성물 — \`pnpm poc:tx\`(scripts/poc-transactions.ts)가 재생성한다.
// 국토부 실거래 기반 실제 가격. NEXT_PUBLIC_POC_REAL_PRICES=1 일 때만 적용.
// (docs/design/data-phase2-1-transactions-poc.md §6)
export const POC_PRICE_OVERRIDE: Record<string, ComplexPrice> = {
${body}
};
`;

writeFileSync(new URL("../src/data/mock/pocPriceOverride.ts", import.meta.url), content);
console.log("\n→ src/data/mock/pocPriceOverride.ts 재생성 완료");
console.log("   화면 확인: NEXT_PUBLIC_POC_REAL_PRICES=1 pnpm dev");

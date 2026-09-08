import type { ComplexPrice } from "@/domain/types";

// PoC 생성물 — `pnpm poc:tx`(scripts/poc-transactions.ts)가 재생성한다.
// 국토부 실거래 기반 실제 가격. NEXT_PUBLIC_POC_REAL_PRICES=1 일 때만 적용.
// (docs/design/data-phase2-1-transactions-poc.md §6)
export const POC_PRICE_OVERRIDE: Record<string, ComplexPrice> = {
  "misa-central": {
    sale: { representative: 136500, min: 125000, max: 147000 },
    jeonse: { representative: 78000, min: 60900, max: 83000 },
  },
};

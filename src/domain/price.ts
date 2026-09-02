// 거래 유형(매매/전세)에 따른 가격·예산 선택 헬퍼 (순수 함수).
// 스코어링·절대조건·UI가 공유한다.

import type { ComplexPrice, DealType, PriceBand, UserConditions } from "./types";

/** 활성 거래 유형의 가격 밴드. 해당 유형 매물이 없으면 undefined. */
export function priceBandFor(
  price: ComplexPrice,
  dealType: DealType,
): PriceBand | undefined {
  return dealType === "sale" ? price.sale : price.jeonse;
}

/** 활성 거래 유형의 예산(만원). */
export function maxBudgetFor(c: UserConditions): number {
  return c.dealType === "sale" ? c.maxSalePrice : c.maxJeonseDeposit;
}

export const DEAL_TYPE_LABEL: Record<DealType, string> = {
  sale: "매매",
  jeonse: "전세",
};

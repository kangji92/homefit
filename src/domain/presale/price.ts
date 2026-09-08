// 분양권/청약 유효 취득가 (순수). HomeFit price 축에 넣는 "그 경로로 얻을 때의
// 총액". resale=총 취득금액(분양가+프리미엄), 그 외=분양가. (presale-rights.md §7.1)

import type { PresaleHome } from "../types";
import { availableAcquisitionPaths } from "./paths";
import { computeCashFlow } from "./cashflow";

/** 유효 취득가(만원). 값 미확정이면 undefined(0 아님). */
export function effectiveAcquisitionPriceManwon(
  home: PresaleHome,
): number | undefined {
  if (!home.offering) return undefined;
  const paths = availableAcquisitionPaths(home);
  if (paths.includes("resale")) {
    // 분양권 매수: 분양가 + 프리미엄
    return computeCashFlow(home.offering).estimatedTotalAcquisition?.manwon;
  }
  // 청약 등: 분양가
  return home.offering.basePrice?.manwon;
}

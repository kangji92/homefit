import type { SubscriptionType } from "../types";

/**
 * 신혼부부 특별공급 자격 안내가 의미 있는 청약 유형인가.
 * 무순위(줍줍)·잔여·취소후재공급은 특별공급이 아니라 무주택·해당지역 거주 위주라, 신혼 특공
 * 자격 패널을 그대로 노출하면 오해를 준다 → 이 유형에서는 숨긴다. 미지정/일반/특공만 true.
 */
export function isSpecialSupplyContext(type?: SubscriptionType): boolean {
  return type === undefined || type === "general" || type === "special";
}

// 규제지역별 청약 조건 도출(결정적). 단지 PDF 없이 **규제지역만 알면** 전매제한·재당첨·청약통장·
// 해당지역 우선을 법정 기준으로 채운다. 버전·출처·기준일 표기(정책 변경 시 여기만 수정).
// 근거: 주택법 시행령(2023.4 개정) · 국토부 · easylaw.go.kr. (docs/design/presale-rights.md)
//
// **실거주 의무·해당지역 거주'기간'은 분양가상한제·대규모택지 등 단지별이라 여기서 도출하지 않는다**
// (undefined → UI "공고 확인"). 무순위는 규정이 별개라 이 함수 대상 아님(통장 무관·재당첨 별도).

import type { SubscriptionConditions } from "../types";

export const SUBSCRIPTION_REGULATION = {
  version: "2023.04",
  asOf: "2023-04",
  source: "주택법 시행령(2023.4 개정)·국토부·easylaw.go.kr",
  /** 수도권 전매제한(개월): 규제지역/공공택지 36 · 과밀억제 12 · 기타 6. */
  resaleMonths: { regulated: 36, overcrowded: 12, other: 6 },
  /** 청약통장 1순위 가입기간(개월): 규제지역 24 · 그 외 수도권 12. */
  accountMonths: { regulated: 24, other: 12 },
};

export interface RegulatoryContext {
  /** 수도권 과밀억제권역 여부(규제지역 아닐 때 전매제한/해당지역 우선 판단). 광명=true. */
  overcrowdedZone?: boolean;
}

/**
 * 규제지역 → 일반/특별공급 청약 조건(전매제한·재당첨·청약통장·해당지역 우선)을 도출.
 * 실거주 의무·거주기간은 도출하지 않음(단지별 → 공고 확인). 무순위엔 쓰지 않는다.
 */
export function regulatoryConditions(
  regulatedArea: NonNullable<SubscriptionConditions["regulatedArea"]>,
  ctx: RegulatoryContext = {},
): SubscriptionConditions {
  const regulated = regulatedArea === "adjustment" || regulatedArea === "speculation_overheated";
  const resaleRestrictionMonths = regulated
    ? SUBSCRIPTION_REGULATION.resaleMonths.regulated
    : ctx.overcrowdedZone
      ? SUBSCRIPTION_REGULATION.resaleMonths.overcrowded
      : SUBSCRIPTION_REGULATION.resaleMonths.other;
  return {
    regulatedArea,
    homelessRequired: true, // 특공·1순위 무주택 세대
    subscriptionAccount: {
      required: true,
      minMonths: regulated ? SUBSCRIPTION_REGULATION.accountMonths.regulated : SUBSCRIPTION_REGULATION.accountMonths.other,
    },
    localResidency: { required: regulated || !!ctx.overcrowdedZone }, // 해당지역 우선(기간은 공고 확인)
    resaleRestrictionMonths,
    rewinLimit: regulated, // 규제지역 공급 → 재당첨 제한 적용
    // mandatoryResidenceMonths: 분양가상한제·시세비율 의존 → 도출 안 함(공고 확인).
  };
}

// 재개발 매물 요약 (순수·결정적). 호가 프리미엄 등 **계산값은 저장하지 않고 여기서 산출**.
// 입주권 자동판정·분담금 추정은 하지 않는다(원본 값을 그대로 통과, 없으면 undefined).
// (docs/design 개발레이어 §4,§7)

import type { Home, Money, OccupancyRightStatus, PropertyListingInfo } from "../types";
import type { DevelopmentArea } from "./types";

export interface ListingPremium {
  /** 호가 − 실거래 (만원, 계산값) */
  amount: Money;
  /** (호가 − 실거래) / 실거래 */
  ratio: number;
}

/** 호가 대비 실거래 프리미엄. 둘 다 있고 실거래>0일 때만 계산. */
export function listingPricePremium(listing?: PropertyListingInfo): ListingPremium | undefined {
  const asking = listing?.askingPrice?.manwon;
  const recent = listing?.recentTransactionPrice?.manwon;
  if (asking == null || recent == null || recent <= 0) return undefined;
  return {
    amount: { manwon: asking - recent, valueProvenance: "computed" },
    ratio: (asking - recent) / recent,
  };
}

export interface RedevelopmentListingSummary {
  askingPrice?: Money;
  recentTransactionPrice?: Money;
  /** 계산값(raw 저장 아님) */
  premium?: ListingPremium;
  exclusiveAreaM2?: number;
  landShareM2?: number;
  inside: boolean;
  /** 실제 상태 자체가 unknown일 수 있어 enum 유지. 미지정은 "unknown". */
  occupancyRightStatus: OccupancyRightStatus;
  /** 없으면 undefined → UI "정보 없음"(임의 추정 안 함). */
  estimatedContribution?: Money;
  /** 연계 구역(패널의 사업명·단계·확정성 표시용). */
  area?: DevelopmentArea;
  updatedAt?: string;
}

/**
 * 매물의 재개발/매물 부가정보를 표시용으로 요약. listing·redevelopment 둘 다 없으면
 * undefined(요약할 것 없음). fitScore/decisionStatus는 건드리지 않는다.
 */
export function redevelopmentListingSummary(
  home: Home,
  area?: DevelopmentArea,
): RedevelopmentListingSummary | undefined {
  const { listing, redevelopment: rd } = home;
  if (!listing && !rd) return undefined;
  return {
    askingPrice: listing?.askingPrice,
    recentTransactionPrice: listing?.recentTransactionPrice,
    premium: listingPricePremium(listing),
    exclusiveAreaM2: listing?.exclusiveAreaM2,
    landShareM2: listing?.landShareM2,
    inside: rd?.inside ?? false,
    occupancyRightStatus: rd?.occupancyRightStatus ?? "unknown",
    estimatedContribution: rd?.estimatedContribution,
    area,
    updatedAt: listing?.updatedAt,
  };
}

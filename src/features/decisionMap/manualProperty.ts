// 수기 입력 → 기존 Home 변환 (순수·테스트 가능). 별도 Property 도메인 없음.
// id/verifiedAt 등 비결정 값은 호출측(폼)이 만들어 넣는다(빌더는 순수). (manual-broker-property §1,§2)

import type { HousingType, Home, Location, Money, OccupancyRightStatus } from "@/domain/types";

export interface ManualPropertyInput {
  id: string;
  displayName: string;
  address?: string;
  housingType: HousingType;
  regionId?: string;
  location?: Location;
  askingPriceManwon?: number;
  recentTransactionManwon?: number;
  publicPriceManwon?: number;
  exclusiveAreaM2?: number;
  landShareM2?: number;
  builtYear?: number;
  floor?: number;
  redevelopmentAreaId?: string;
  /** 공식 경계 내부 확인 여부. 수기 연결은 보통 undefined(미확인) — 자동 true 금지. */
  redevelopmentInside?: boolean;
  previousAssetAppraisalManwon?: number;
  occupancyRightStatus?: OccupancyRightStatus;
  /** 사용자가 고른 희망 신축 평형(MemberSaleEstimate.id). */
  desiredMemberSaleEstimateId?: string;
  sourceType: "broker" | "user_input";
  sourceLabel?: string;
  verifiedAt?: string;
}

const money = (manwon?: number): Money | undefined =>
  manwon != null ? { manwon, valueProvenance: "user_input" } : undefined;

export function buildManualProperty(input: ManualPropertyInput): Home {
  const pyeong = input.exclusiveAreaM2 != null ? [Math.round((input.exclusiveAreaM2 / 3.3058) * 10) / 10] : [];
  return {
    kind: "existing",
    id: input.id,
    name: input.displayName,
    regionId: input.regionId ?? "pyeongchon",
    price: { sale: input.askingPriceManwon != null ? { representative: input.askingPriceManwon } : undefined },
    sizesPyeong: pyeong,
    commuteMinutes: {},
    metrics: { education: 50, infrastructure: 50, environment: 50, futurePotential: 50 },
    completionYear: input.builtYear ?? 2000, // 미입력 fallback(표시용, HomeFit 미사용 전제)
    households: 1,
    stationDistanceM: 0,
    housingType: input.housingType,
    location: input.location,
    locationAccuracy: input.location ? "area" : undefined,
    listing: {
      askingPrice: money(input.askingPriceManwon),
      recentTransactionPrice: money(input.recentTransactionManwon),
      publicPrice: money(input.publicPriceManwon),
      exclusiveAreaM2: input.exclusiveAreaM2,
      landShareM2: input.landShareM2,
      floor: input.floor,
      sourceType: input.sourceType,
      sourceLabel: input.sourceLabel,
      verifiedAt: input.verifiedAt,
    },
    redevelopment: input.redevelopmentAreaId
      ? {
          areaId: input.redevelopmentAreaId,
          // 사용자가 사업을 고른 것만으로 "구역 내부 확인"을 단정하지 않는다 → 미확인(undefined).
          inside: input.redevelopmentInside,
          occupancyRightStatus: input.occupancyRightStatus,
          previousAssetAppraisal: money(input.previousAssetAppraisalManwon),
          desiredMemberSaleEstimateId: input.desiredMemberSaleEstimateId,
        }
      : undefined,
  };
}

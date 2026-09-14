// 계획안(DevelopmentPlan[]) 필드별 비교 (순수). 서로 다른 출처의 값을 **하나로 합치지
// 않고** 나란히 반환한다. 값이 다르다고 오류 취급하지 않는다 — "출처가 다른 계획안".
// (docs/design 개발레이어 real-pilot §4)

import type {
  DataSourceType,
  DevelopmentPlan,
  DevelopmentPlanType,
  DevelopmentVerification,
} from "./types";

/** plan 간 비교 가능한 필드(숫자/문자). */
export type ComparablePlanField =
  | "totalUnits"
  | "memberUnits"
  | "saleUnits"
  | "generalSaleUnits"
  | "rentalUnits"
  | "buildingCount"
  | "maxFloor"
  | "buildingCoverageRatioMax"
  | "floorAreaRatioMax"
  | "contractor"
  | "brand"
  | "proposedComplexName";

export interface PlanFieldValue {
  planId: string;
  planType: DevelopmentPlanType;
  value: string | number;
  sourceType: DataSourceType;
  sourceLabel?: string;
  verification?: DevelopmentVerification;
}

/** 해당 필드에 값이 있는 plan만, 각각의 값+출처로 반환(undefined는 제외). */
export function planFieldComparison(
  plans: DevelopmentPlan[],
  field: ComparablePlanField,
): PlanFieldValue[] {
  const out: PlanFieldValue[] = [];
  for (const p of plans) {
    const value = p[field];
    if (value === undefined || value === null || value === "") continue;
    out.push({
      planId: p.id,
      planType: p.type,
      value,
      sourceType: p.sourceType,
      sourceLabel: p.sourceLabel,
      verification: p.verification,
    });
  }
  return out;
}

/** 서로 다른 값이 2개 이상인가(충돌 = 나란히 보여줄 대상). */
export function planFieldsDiffer(values: PlanFieldValue[]): boolean {
  return new Set(values.map((v) => v.value)).size > 1;
}

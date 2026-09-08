// 자격 요건 공용 헬퍼 (순수). 신혼부부 엔진과 프로그램 카탈로그가 공유한다.
// 미입력 값은 fail이 아니라 unknown.

import type { HouseholdProfile, HousingStatus } from "../types";
import type { IncomeRatio, SubscriptionPolicy } from "./policy";

export type RequirementStatus = "pass" | "fail" | "unknown";

export interface Requirement {
  key: string;
  label: string;
  status: RequirementStatus;
  detail?: string;
}

/** 값이 undefined면 unknown, 아니면 조건 통과 여부로 pass/fail */
export function check(
  value: number | undefined,
  ok: (v: number) => boolean,
): RequirementStatus {
  if (value === undefined) return "unknown";
  return ok(value) ? "pass" : "fail";
}

export function housingRequirement(
  status: HousingStatus | undefined,
): Requirement {
  return {
    key: "housing",
    label: "무주택(세대)",
    status:
      status === undefined ? "unknown" : status === "none" ? "pass" : "fail",
  };
}

export function subscriptionRequirement(
  profile: HouseholdProfile,
  policy: SubscriptionPolicy,
): Requirement {
  return {
    key: "subscription",
    label: `청약통장 ${policy.minSubscriptionMonths}개월 이상`,
    status: check(
      profile.subscriptionMonths,
      (m) => m >= policy.minSubscriptionMonths,
    ),
  };
}

/**
 * 소득 상한(만원) = 도시근로자 월평균소득 × 비율(맞벌이/외벌이).
 * 가구원수·맞벌이 여부가 있어야 상한이 정해진다(없으면 unknown).
 */
export function incomeLimitManwon(
  policy: SubscriptionPolicy,
  householdSize: number | undefined,
  dualIncome: boolean | undefined,
  ratio: IncomeRatio,
): number | undefined {
  if (householdSize === undefined || dualIncome === undefined) return undefined;
  const base = policy.urbanIncome100Manwon[householdSize];
  if (base === undefined) return undefined;
  const pct = dualIncome ? ratio.dual : ratio.single;
  return Math.round((base * pct) / 100);
}

export function incomeRequirement(
  profile: HouseholdProfile,
  policy: SubscriptionPolicy,
  ratio: IncomeRatio,
): Requirement {
  const limit = incomeLimitManwon(
    policy,
    profile.householdSize,
    profile.dualIncome,
    ratio,
  );
  if (limit === undefined || profile.monthlyIncomeManwon === undefined) {
    return { key: "income", label: "소득요건", status: "unknown" };
  }
  const pct = profile.dualIncome ? ratio.dual : ratio.single;
  return {
    key: "income",
    label: `월소득 ${limit}만원 이하`,
    detail: `도시근로자 소득 ${pct}%(${profile.dualIncome ? "맞벌이" : "외벌이"})`,
    status: profile.monthlyIncomeManwon <= limit ? "pass" : "fail",
  };
}

/** 부동산·자동차 상한을 각각 판정한다. */
export function assetRequirements(
  profile: HouseholdProfile,
  policy: SubscriptionPolicy,
): Requirement[] {
  return [
    {
      key: "realEstate",
      label: `부동산 ${(policy.realEstateLimitManwon / 10000).toFixed(2)}억 이하`,
      status: check(
        profile.realEstateAssetManwon,
        (v) => v <= policy.realEstateLimitManwon,
      ),
    },
    {
      key: "car",
      label: `자동차 ${policy.carLimitManwon}만원 이하`,
      status: check(profile.carValueManwon, (v) => v <= policy.carLimitManwon),
    },
  ];
}

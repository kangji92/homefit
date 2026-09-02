// 신혼부부 특별공급 자격 판정 (순수·결정적). 정책은 주입(버전드).
// 미입력 값은 fail이 아니라 unknown. (docs/design/data-phase2c-household-eligibility.md §3.1)

import type { HouseholdProfile } from "../types";
import { DEFAULT_SUBSCRIPTION_POLICY, type SubscriptionPolicy } from "./policy";

export type RequirementStatus = "pass" | "fail" | "unknown";

export interface Requirement {
  key: string;
  label: string;
  status: RequirementStatus;
  detail?: string;
}

export interface Eligibility {
  program: string;
  /** 모든 요건 pass일 때만 true (unknown 있으면 false) */
  eligible: boolean;
  hasUnknown: boolean;
  requirements: Requirement[];
  asOf: string;
  policyVersion: string;
}

/** 값이 undefined면 unknown, 아니면 조건 통과 여부로 pass/fail */
function check(
  value: number | undefined,
  ok: (v: number) => boolean,
): RequirementStatus {
  if (value === undefined) return "unknown";
  return ok(value) ? "pass" : "fail";
}

export function evaluateNewlywedSpecial(
  profile: HouseholdProfile,
  policy: SubscriptionPolicy = DEFAULT_SUBSCRIPTION_POLICY,
): Eligibility {
  const requirements: Requirement[] = [];

  // 혼인 요건 — 신혼부부 특공은 법적 혼인(신고)이 필수.
  //   예비: pass(입주 전 혼인 조건) / 사실혼: fail(혼인신고 필요) / 기혼: 7년 이내
  const marriage = ((): Requirement => {
    const base = {
      key: "marriage",
      label: `혼인 ${Math.round(policy.marriageMaxMonths / 12)}년 이내(법적 혼인)`,
    };
    switch (profile.maritalStatus) {
      case undefined:
        return { ...base, status: "unknown" };
      case "prospective":
        return { ...base, status: "pass", detail: "예비 신혼부부" };
      case "de_facto":
        return {
          ...base,
          status: "fail",
          detail: "사실혼은 대상 아님 · 혼인신고 필요",
        };
      case "married":
        return {
          ...base,
          status: check(profile.marriedMonths, (m) => m <= policy.marriageMaxMonths),
        };
    }
  })();
  requirements.push(marriage);

  requirements.push({
    key: "housing",
    label: "무주택",
    status:
      profile.housingStatus === undefined
        ? "unknown"
        : profile.housingStatus === "none"
          ? "pass"
          : "fail",
  });

  requirements.push({
    key: "subscription",
    label: `청약통장 ${policy.minSubscriptionMonths}개월 이상`,
    status: check(
      profile.subscriptionMonths,
      (m) => m >= policy.minSubscriptionMonths,
    ),
  });

  requirements.push({
    key: "income",
    label: `월소득 ${policy.incomeLimitManwon}만원 이하`,
    status: check(
      profile.monthlyIncomeManwon,
      (v) => v <= policy.incomeLimitManwon,
    ),
  });

  requirements.push({
    key: "asset",
    label: `자산 ${(policy.assetLimitManwon / 10000).toFixed(2)}억 이하`,
    status: check(profile.totalAssetManwon, (v) => v <= policy.assetLimitManwon),
  });

  const hasUnknown = requirements.some((r) => r.status === "unknown");
  const eligible = requirements.every((r) => r.status === "pass");

  return {
    program: "신혼부부 특별공급",
    eligible,
    hasUnknown,
    requirements,
    asOf: policy.asOf,
    policyVersion: policy.version,
  };
}

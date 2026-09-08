// 시나리오 what-if — 프로필 상태를 바꾸면 "새로 열리는" 청약 프로그램 계산.
// 순수·결정적. (docs/design/data-phase2c-household-eligibility.md §4.5)
// 절세/편법 조장이 아니라 "상태 변화에 따른 제도상 가능성" 정보 제공.

import type { HouseholdProfile } from "../types";
import { DEFAULT_SUBSCRIPTION_POLICY, type SubscriptionPolicy } from "./policy";
import { evaluatePrograms, type ProgramResult } from "./programs";

export interface Scenario {
  key: string;
  label: string;
  apply: (p: HouseholdProfile) => HouseholdProfile;
}

export const SCENARIOS: Scenario[] = [
  {
    key: "register",
    label: "혼인신고하면",
    apply: (p) => ({
      ...p,
      maritalStatus: "married",
      marriedMonths: p.marriedMonths ?? 0,
    }),
  },
  {
    key: "sell",
    label: "유주택 배우자가 집을 팔면",
    apply: (p) => ({ ...p, housingStatus: "none" }),
  },
  {
    key: "newborn",
    label: "임신·출산하면",
    apply: (p) => ({
      ...p,
      minorChildren: (p.minorChildren ?? 0) + 1,
      hasNewborn: true,
    }),
  },
  {
    key: "sell_register",
    label: "집 팔고 혼인신고하면",
    apply: (p) => ({
      ...p,
      housingStatus: "none",
      maritalStatus: "married",
      marriedMonths: p.marriedMonths ?? 0,
    }),
  },
];

export interface WhatIfResult {
  scenario: { key: string; label: string };
  /** 시나리오 적용 시 eligible이지만 현재는 아닌 프로그램 */
  unlocked: ProgramResult[];
}

export function whatIf(
  profile: HouseholdProfile,
  policy: SubscriptionPolicy = DEFAULT_SUBSCRIPTION_POLICY,
): WhatIfResult[] {
  const currentlyEligible = new Set(
    evaluatePrograms(profile, policy)
      .filter((p) => p.eligible)
      .map((p) => p.key),
  );

  return SCENARIOS.map((s) => {
    const unlocked = evaluatePrograms(s.apply(profile), policy).filter(
      (p) => p.eligible && !currentlyEligible.has(p.key),
    );
    return { scenario: { key: s.key, label: s.label }, unlocked };
  }).filter((r) => r.unlocked.length > 0);
}

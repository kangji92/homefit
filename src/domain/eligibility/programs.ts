// 청약 프로그램 카탈로그 평가 (순수·결정적·버전드).
// 각 프로그램 = 요건 pass/fail/unknown → eligible/not. 정책 주입.
// 미입력 값은 fail이 아니라 unknown.
// (docs/design/data-phase2c-household-eligibility.md §4.5)

import type { HouseholdProfile, HousingStatus } from "../types";
import { DEFAULT_SUBSCRIPTION_POLICY, type SubscriptionPolicy } from "./policy";
import {
  evaluateNewlywedSpecial,
  type Requirement,
  type RequirementStatus,
} from "./newlywed";

export type ProgramKind = "subscription"; // 대출은 2C-2에서 추가

export interface ProgramResult {
  key: string;
  name: string;
  kind: ProgramKind;
  /** 모든 요건 pass일 때만 true (unknown 있으면 false) */
  eligible: boolean;
  hasUnknown: boolean;
  requirements: Requirement[];
  /** 유주택 세대도 신청 가능한 프로그램인지 (카탈로그 표시) */
  allowsOwnHome: boolean;
  note?: string;
  asOf: string;
  policyVersion: string;
}

export const PROGRAM_KEYS = [
  "newlywed",
  "firstTime",
  "multiChild",
  "newborn",
  "general",
  "unranked",
] as const;

// ── 요건 헬퍼 ────────────────────────────────────────────
function check(
  value: number | undefined,
  ok: (v: number) => boolean,
): RequirementStatus {
  if (value === undefined) return "unknown";
  return ok(value) ? "pass" : "fail";
}

function housingReq(status: HousingStatus | undefined): Requirement {
  return {
    key: "housing",
    label: "무주택(세대)",
    status:
      status === undefined ? "unknown" : status === "none" ? "pass" : "fail",
  };
}

function incomeReq(
  p: HouseholdProfile,
  limit: number,
): Requirement {
  return {
    key: "income",
    label: `월소득 ${limit}만원 이하`,
    status: check(p.monthlyIncomeManwon, (v) => v <= limit),
  };
}

function assetReq(p: HouseholdProfile, policy: SubscriptionPolicy): Requirement {
  return {
    key: "asset",
    label: `자산 ${(policy.assetLimitManwon / 10000).toFixed(2)}억 이하`,
    status: check(p.totalAssetManwon, (v) => v <= policy.assetLimitManwon),
  };
}

function subscriptionReq(
  p: HouseholdProfile,
  policy: SubscriptionPolicy,
): Requirement {
  return {
    key: "subscription",
    label: `청약통장 ${policy.minSubscriptionMonths}개월 이상`,
    status: check(p.subscriptionMonths, (m) => m >= policy.minSubscriptionMonths),
  };
}

function build(
  key: string,
  name: string,
  requirements: Requirement[],
  opts: { allowsOwnHome?: boolean; note?: string },
  policy: SubscriptionPolicy,
): ProgramResult {
  const hasUnknown = requirements.some((r) => r.status === "unknown");
  const eligible = requirements.every((r) => r.status === "pass");
  return {
    key,
    name,
    kind: "subscription",
    eligible,
    hasUnknown,
    requirements,
    allowsOwnHome: opts.allowsOwnHome ?? false,
    note: opts.note,
    asOf: policy.asOf,
    policyVersion: policy.version,
  };
}

// ── 카탈로그 ─────────────────────────────────────────────
export function evaluatePrograms(
  profile: HouseholdProfile,
  policy: SubscriptionPolicy = DEFAULT_SUBSCRIPTION_POLICY,
): ProgramResult[] {
  // 신혼부부 특공은 전용 엔진 재사용(혼인·예비·사실혼 판정 포함).
  const nw = evaluateNewlywedSpecial(profile, policy);
  const newlywed: ProgramResult = {
    key: "newlywed",
    name: nw.program,
    kind: "subscription",
    eligible: nw.eligible,
    hasUnknown: nw.hasUnknown,
    requirements: nw.requirements,
    allowsOwnHome: false,
    asOf: nw.asOf,
    policyVersion: nw.policyVersion,
  };

  const firstTime = build(
    "firstTime",
    "생애최초 특별공급",
    [
      housingReq(profile.housingStatus),
      subscriptionReq(profile, policy),
      incomeReq(profile, policy.incomeLimitManwon),
      assetReq(profile, policy),
    ],
    { note: "세대 구성원 전원 과거 주택 소유 이력이 없어야 해요(자기신고)." },
    policy,
  );

  const multiChild = build(
    "multiChild",
    "다자녀 특별공급",
    [
      {
        key: "children",
        label: `미성년 자녀 ${policy.multiChildMinChildren}명 이상`,
        status: check(
          profile.minorChildren,
          (n) => n >= policy.multiChildMinChildren,
        ),
      },
      housingReq(profile.housingStatus),
      incomeReq(profile, policy.incomeLimitManwon),
      assetReq(profile, policy),
    ],
    { note: "태아·입양 자녀 포함(공고별 상이)." },
    policy,
  );

  const newborn = build(
    "newborn",
    "신생아 특별공급",
    [
      {
        key: "newborn",
        label: "최근 2년내 출산(임신 포함)",
        status:
          profile.hasNewborn === undefined
            ? "unknown"
            : profile.hasNewborn
              ? "pass"
              : "fail",
      },
      housingReq(profile.housingStatus),
      incomeReq(profile, policy.newbornIncomeLimitManwon),
      assetReq(profile, policy),
    ],
    { note: "소득 요건이 완화돼요(신생아 우선·특별공급)." },
    policy,
  );

  const general = build(
    "general",
    "일반공급(추첨제)",
    [subscriptionReq(profile, policy)],
    {
      allowsOwnHome: true,
      note: "추첨제 물량은 유주택 세대도 신청 가능한 경우가 있어요.",
    },
    policy,
  );

  // 무순위(줍줍) — 현행(2024~) 전국·유주택 허용. 사실상 신청 자체는 열려 있음.
  const unranked = build(
    "unranked",
    "무순위(줍줍)",
    [
      {
        key: "open",
        label: "성년 신청(주택 소유·청약통장 무관)",
        status: "pass",
      },
    ],
    {
      allowsOwnHome: true,
      note: "공고별 거주·재당첨 제한이 있을 수 있어요(개별 확인).",
    },
    policy,
  );

  return [newlywed, firstTime, multiChild, newborn, general, unranked];
}

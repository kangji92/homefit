// 청약 자격 스크리닝 계층 (순수). Strategy generation/decision이 `hasHome`를
// 정책 규칙처럼 직접 해석하지 않도록, 자격 판단을 이 계층으로 일원화한다.
//   pass    → 랭크드 프로그램(특공/일반) 중 하나라도 요건 전부 충족
//   unknown → hard-fail 없이 미입력(unknown)만 남아 잠재적으로 가능
//   fail    → 랭크드 프로그램이 전부 hard-fail (예: 통장 없음·유주택+특공)
//
// 무주택 여부는 프로그램별 요건(housingRequirement)에 이미 인코딩돼 있다.
// 일반공급(추첨제)은 유주택도 통장만 있으면 통과하므로, 유주택이라고 일괄
// 제외하지 않는다 — 자격 계층이 공급유형별로 판정한다.
//
// 무순위(줍줍)는 항상 열려 있어(누구나 eligible) 판별신호가 되지 못하므로
// 스크리닝에서 제외한다(카탈로그로는 evaluatePrograms에 그대로 남아 있음).
//
// TODO(MVP): evaluatePrograms는 현재 청약(subscription) 프로그램만 다룬다.
// 공급유형(공공/민영)·공고별 거주요건·대출 연계는 미모델. 이 계층은 그 범위가
// 넓어지면 자연히 정교해진다. (housing-strategy.md §6, product-vision Scope)

import type { HouseholdProfile } from "../types";
import { DEFAULT_SUBSCRIPTION_POLICY, type SubscriptionPolicy } from "./policy";
import { evaluatePrograms } from "./programs";

export type EligibilityScreenStatus = "pass" | "unknown" | "fail";

export interface EligibilityScreen {
  status: EligibilityScreenStatus;
  /** 판정 근거가 된 프로그램명(있을 때) */
  program?: string;
}

/** 무순위(줍줍)는 항상 열려 있어 판별에서 제외한다. */
const RANKED = (key: string) => key !== "unranked";

export function screenSubscriptionEligibility(
  profile: HouseholdProfile,
  policy: SubscriptionPolicy = DEFAULT_SUBSCRIPTION_POLICY,
): EligibilityScreen {
  const ranked = evaluatePrograms(profile, policy).filter((p) => RANKED(p.key));

  const eligible = ranked.find((p) => p.eligible);
  if (eligible) return { status: "pass", program: eligible.name };

  // hard-fail(요건 중 fail)이 없고 unknown만 남으면 잠재적으로 가능 → unknown
  const potential = ranked.find(
    (p) => p.hasUnknown && !p.requirements.some((r) => r.status === "fail"),
  );
  if (potential) return { status: "unknown", program: potential.name };

  return { status: "fail" };
}

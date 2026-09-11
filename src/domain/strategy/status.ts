// Decision Status 결정 (순수·결정적·보수적). status는 항상 reason과 함께 반환하고,
// UI 문구에 규칙이 종속되지 않게 도메인에 둔다. (housing-strategy.md §8, §16 추가원칙)
//
// 원칙:
// - recommended는 보수적: fit이 충분히 높고 + 감당 가능 + (필요 시)자격 pass +
//   의미 있는 unknown/위험이 없을 때만. HomeFit이 높다는 이유만으로는 안 됨.
// - 핵심 요소에 unknown/needs_review가 남으면 recommended보다 needs_review/consider.
// - blocked는 명확한 hard constraint 실패/실행 불가일 때만.

import { deriveTransactionRisk } from "../presale";
import type {
  AreaFitResult,
  DecisionReason,
  DecisionStatus,
  FitResult,
  StrategyKind,
  TransferInfo,
} from "../types";
import type { StrategyConfig } from "./config";

export interface StatusInput {
  kind: StrategyKind;
  fit?: FitResult | AreaFitResult;
  affordability: { verdict: "ok" | "short" | "unknown" };
  eligibility?: { status: "pass" | "fail" | "unknown" };
  transfer?: TransferInfo;
  risk: {
    /** 사용자가 아직 정하지 않은 중간 단계. 이것만 있으면 needs_review로 강등하지 않는다. */
    incompleteInputs: string[];
  };
}

const isHomeFit = (f?: FitResult | AreaFitResult): f is FitResult =>
  !!f && "passesDealbreakers" in f;

export function deriveDecisionStatus(
  d: StatusInput,
  config: StrategyConfig,
): { status: DecisionStatus; reasons: DecisionReason[] } {
  const reasons: DecisionReason[] = [];
  const add = (code: string, text: string) => reasons.push({ code, text });

  // ── blocked: hard constraint 실패/실행 불가 ──
  const fit = d.fit;
  if (isHomeFit(fit) && !fit.passesDealbreakers) {
    add("blocked_dealbreaker", "절대 조건을 충족하지 못했어요.");
  }
  if (d.affordability.verdict === "short") {
    add("blocked_afford_short", "예산·가용자금으로 감당하기 어려워요.");
  }
  if (d.kind === "buy_presale_right" && d.transfer?.status === "restricted") {
    add("blocked_transfer_restricted", "전매제한 중이라 지금 매수할 수 없어요.");
  }
  if (d.eligibility?.status === "fail") {
    add("blocked_ineligible", "청약 자격 요건을 충족하지 못했어요.");
  }
  if (reasons.length) return { status: "blocked", reasons };

  // ── needs_review: 의미 있는 unknown ──
  if (d.eligibility?.status === "unknown") {
    add("review_eligibility_unknown", "청약 자격이 아직 판정되지 않았어요(프로필 확인).");
  }
  if (d.transfer && deriveTransactionRisk(d.transfer) !== "normal") {
    add("review_transfer", "전매 상태·권리 확인이 필요해요.");
  }
  if (d.affordability.verdict === "unknown") {
    add("review_afford_unknown", "필요 자금이 아직 확정되지 않았어요.");
  }
  if (isHomeFit(fit) && fit.unknownDealbreakers.length > 0) {
    add("review_fit_unknown", "일부 조건(역거리·세대수 등)이 미확정이에요.");
  }
  if (reasons.length) return { status: "needs_review", reasons };

  // ── recommended: 보수적 ──
  // 여기 도달했다면 required_review(자격·전매·자금·fit)는 이미 없다(위에서 return).
  // 남은 것은 fit/affordability와, 아직 정하지 않은 중간 단계(incompleteInputs)뿐.
  const score = fit?.totalScore ?? 0;
  const fitStrong = score >= config.recommendFitMin;
  const affordable = d.affordability.verdict === "ok";
  const eligibleOk = !d.eligibility || d.eligibility.status === "pass";
  const complete = d.risk.incompleteInputs.length === 0;
  if (fitStrong && affordable && eligibleOk && complete) {
    add("recommended", "적합도·감당가능성·자격이 모두 양호해요.");
    return { status: "recommended", reasons };
  }

  // ── consider: 실행 가능하나 트레이드오프 ──
  // incompleteInputs만 있는 경우도 여기(consider) — needs_review로 강등하지 않는다.
  if (!fitStrong) add("consider_fit_moderate", "적합도가 최상은 아니에요.");
  if (!affordable) add("consider_afford", "감당가능성 확인이 필요해요.");
  if (!complete) add("consider_incomplete", "아직 정하지 않은 중간 단계가 있어요.");
  if (reasons.length === 0) add("consider", "실행 가능하나 고려할 점이 있어요.");
  return { status: "consider", reasons };
}

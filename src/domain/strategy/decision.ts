// 전략 Decision 산출 (순수). 새 점수를 만들지 않고 기존 엔진을 직교로 조합한다:
// fit(computeFit/computeAreaFit) + affordability(computeCashFlow) + 자격
// (evaluatePrograms) + transfer(deriveTransactionRisk) + timing. (housing-strategy.md §7,§9)

import { computeAreaFit, computeFit } from "../scoring";
import { DEFAULT_SCORING_CONFIG } from "../scoring/config";
import { maxBudgetFor, priceBandFor } from "../price";
import { computeCashFlow, deriveTransactionRisk } from "../presale";
import { screenSubscriptionEligibility } from "../eligibility/screen";
import type {
  DealbreakerStatus,
  HousingStrategy,
  StrategyDecision,
  TransferInfo,
} from "../types";
import { DEFAULT_STRATEGY_CONFIG } from "./config";
import { RENT_RETAIN_NOTE, type StrategyInput } from "./generate";
import { deriveDecisionStatus } from "./status";

type Verdict = "ok" | "short" | "unknown";

export function computeStrategyDecision(
  strategy: HousingStrategy,
  ctx: StrategyInput,
): StrategyDecision {
  const cfg = ctx.config ?? DEFAULT_STRATEGY_CONFIG;
  const scoringCfg = ctx.scoringConfig ?? DEFAULT_SCORING_CONFIG;

  const targetHome =
    strategy.targetRef && strategy.targetRef.kind !== "area"
      ? ctx.homes.find((h) => h.id === strategy.targetRef!.id)
      : undefined;
  const targetArea =
    strategy.targetRef?.kind === "area"
      ? ctx.areas.find((a) => a.id === strategy.targetRef!.id)
      : undefined;

  const fit = targetHome
    ? computeFit(ctx.conditions, ctx.priorities, ctx.dealbreakers, targetHome, scoringCfg)
    : targetArea
      ? computeAreaFit(ctx.priorities, targetArea)
      : undefined;

  // ── affordability (지금 필요현금 + 향후 주요부담) ──
  let cashNeededNow: number | undefined;
  let futureBurden: number | undefined;
  let verdict: Verdict = "unknown";
  const presale = targetHome?.kind === "presale" ? targetHome : undefined;

  if (strategy.kind === "buy_existing" && targetHome) {
    const price = priceBandFor(targetHome.price, ctx.conditions.dealType)?.representative;
    verdict = price === undefined ? "unknown" : price <= maxBudgetFor(ctx.conditions) ? "ok" : "short";
  } else if (strategy.kind === "buy_presale_right" && presale?.offering) {
    const cf = computeCashFlow(presale.offering);
    cashNeededNow = cf.cashNeededAtPurchase?.manwon;
    futureBurden = cf.balance?.manwon;
    verdict =
      cashNeededNow === undefined
        ? "unknown"
        : ctx.conditions.availableFunds >= cashNeededNow
          ? "ok"
          : "short";
  } else if (
    (strategy.kind === "apply_presale" || strategy.kind === "rent_then_apply") &&
    presale
  ) {
    const base =
      presale.offering?.basePrice?.manwon ??
      priceBandFor(presale.price, "sale")?.representative;
    verdict = base === undefined ? "unknown" : base <= ctx.conditions.maxSalePrice ? "ok" : "short";
    if (base !== undefined) {
      cashNeededNow = Math.round(base * cfg.presaleDownPaymentRatio); // 계약금(당첨 시)
      futureBurden = base - cashNeededNow;
    }
  }

  // ── eligibility (청약 계열만) — 스크리닝 계층 재사용(무순위 제외, 공급유형별) ──
  let eligibility: { status: DealbreakerStatus; program?: string } | undefined;
  if (strategy.kind === "apply_presale" || strategy.kind === "rent_then_apply") {
    const screen = screenSubscriptionEligibility(ctx.profile);
    eligibility = { status: screen.status, program: screen.program };
  }

  // ── transfer (분양권만) ──
  const transfer: TransferInfo | undefined =
    strategy.kind === "buy_presale_right" ? presale?.transfer : undefined;

  // ── timing ──
  const moveIn = [...strategy.steps].reverse().find((s) => s.kind === "move_in");
  const settleBy = moveIn?.timing.targetYear;
  const horizon = moveIn?.timing.horizon ?? (strategy.kind === "buy_existing" ? "now" : "mid");

  // ── risk: 두 성격의 불확실성을 구분한다 ──
  // requiredReviews: 확인이 필요한 항목(자격·전매/권리·자금·법적) → needs_review 유발.
  // incompleteInputs: 사용자가 아직 정하지 않은 중간 단계 → 강등하지 않음(consider 유지).
  const requiredReviews: string[] = [];
  if (fit && "unknownDealbreakers" in fit && fit.unknownDealbreakers.length)
    requiredReviews.push("일부 조건(역거리·세대수 등) 미확정");
  if (eligibility?.status === "unknown") requiredReviews.push("청약 자격 미판정");
  if (transfer && deriveTransactionRisk(transfer) !== "normal")
    requiredReviews.push("전매 상태·권리 확인 필요");
  if (verdict === "unknown") requiredReviews.push("필요 자금 미확정");

  const incompleteInputs: string[] = [];
  // rent_then_apply의 중간 전세 step은 실제 후보 ref가 없을 수 있다. 최종
  // targetRef(청약 대상)는 있으므로 "추상 전략"이 아니라, 전세 후보만 미선정이다.
  // 단, 현재 전세를 유지(RENT_RETAIN_NOTE)하면 미선정이 아니라 해소된 것.
  if (
    strategy.kind === "rent_then_apply" &&
    strategy.steps.some((s) => s.kind === "rent" && !s.ref && s.note !== RENT_RETAIN_NOTE)
  )
    incompleteInputs.push("전세 후보 미선정");
  const flags = transfer?.riskFlags.map(String) ?? [];

  const { status, reasons } = deriveDecisionStatus(
    { kind: strategy.kind, fit, affordability: { verdict }, eligibility, transfer, risk: { incompleteInputs } },
    cfg,
  );

  // ── pros / cons / nextActions ──
  const score = fit?.totalScore ?? 0;
  const pros: string[] = [];
  const cons: string[] = [];
  const nextActions: string[] = [];
  if (score >= cfg.recommendFitMin) pros.push("우리 조건 적합도가 높아요");
  if (verdict === "ok") pros.push(strategy.kind === "buy_existing" ? "예산 내예요" : "자금 감당 가능해요");
  if (horizon === "now") pros.push("즉시 정착 가능해요");
  if (eligibility?.status === "pass") pros.push(`${eligibility.program} 가능성이 있어요`);

  if (verdict === "short") cons.push("예산/가용자금으로 벅차요");
  if (horizon === "long") cons.push("정착까지 시간이 걸려요");
  if (cashNeededNow) cons.push(`지금 필요 현금 약 ${(cashNeededNow / 10000).toFixed(1)}억`);

  if (eligibility?.status === "unknown") nextActions.push("가구 프로필을 채워 청약 자격을 확인하세요");
  if (transfer && deriveTransactionRisk(transfer) !== "normal") nextActions.push("전매 상태·권리를 공식 공고로 확인하세요");
  if (verdict === "unknown") nextActions.push("가격·필요자금 정보를 확인하세요");
  if (
    strategy.kind === "rent_then_apply" &&
    strategy.steps.some((s) => s.kind === "rent" && !s.ref && s.note !== RENT_RETAIN_NOTE)
  )
    nextActions.push("거주할 전세 후보를 추가로 탐색하세요");

  return {
    strategyId: strategy.id,
    status,
    reasons,
    fit,
    affordability: { cashNeededNow, futureBurden, verdict },
    timing: { settleBy, horizon },
    eligibility,
    transfer,
    risk: { flags, requiredReviews, incompleteInputs },
    pros,
    cons,
    nextActions,
  };
}

// 결정 서사(narrative) + trade-off 요약 — 모두 **deterministic rule 기반**. AI 생성
// 문구는 쓰지 않는다. Decision 결과(facet)에 따라 일부 문구가 달라진다.
// (housing-strategy.md §17, product-vision Compare/Decide)

import { DEFAULT_STRATEGY_CONFIG } from "@/domain/strategy";
import { formatKoreanMoney } from "@/lib/format";
import type { StrategyBoardItem } from "./strategyView";

const HORIZON_RANK = { now: 0, short: 1, mid: 2, long: 3 } as const;

/** 전략 한 줄 서사. kind 기본 문구 + Decision facet에 따른 변주(결정적). */
export function strategyNarrative({ strategy, decision }: StrategyBoardItem): string {
  switch (strategy.kind) {
    case "buy_existing":
      return decision.timing.horizon === "now"
        ? "지금 바로 정착하고 불확실성을 줄이는 선택"
        : "정착 시점을 앞당겨 불확실성을 줄이는 선택";
    case "apply_presale":
      return decision.affordability.verdict === "ok"
        ? "초기 자금 부담을 낮추고 신축 기회를 노리는 선택"
        : "신축 기회를 노리되 자금 계획이 필요한 선택";
    case "rent_then_apply":
      return decision.eligibility?.status === "pass"
        ? "청약 자격을 살려 현재 생활을 유지하며 장기 정착을 기다리는 선택"
        : "현재 생활을 유지하며 장기 정착 기회를 기다리는 선택";
    case "buy_presale_right":
      return "청약 결과를 기다리지 않고 신축 입주권을 확보하는 선택";
  }
}

export interface TradeoffItem {
  id: string;
  label: string;
  strengths: string[];
  weaknesses: string[];
}

/**
 * 전략들을 사용자 언어의 +/- 로 요약한다. 종합 승자를 만들지 않고, 각 전략이 무엇을
 * 우선하는지(강점)와 대가로 무엇을 포기하는지(약점)를 서로 비교해 결정적으로 만든다.
 */
export function tradeoffSummary(columns: StrategyBoardItem[]): TradeoffItem[] {
  const recMin = DEFAULT_STRATEGY_CONFIG.recommendFitMin;
  const fits = columns.map((c) => c.decision.fit?.totalScore ?? -1);
  const cashes = columns
    .map((c) => c.decision.affordability.cashNeededNow)
    .filter((v): v is number => v != null);
  const ranks = columns.map((c) => HORIZON_RANK[c.decision.timing.horizon]);
  const maxFit = Math.max(...fits);
  const minCash = cashes.length ? Math.min(...cashes) : undefined;
  const minRank = Math.min(...ranks);
  const multi = columns.length > 1;

  return columns.map((c) => {
    const d = c.decision;
    const fit = d.fit?.totalScore ?? -1;
    const cash = d.affordability.cashNeededNow;
    const rank = HORIZON_RANK[d.timing.horizon];
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (multi && fit === maxFit && fit >= 0) strengths.push("적합도가 가장 높아요");
    if (minCash != null && cash === minCash) strengths.push("지금 필요한 현금이 가장 적어요");
    if (multi && rank === minRank) strengths.push("가장 빨리 정착해요");
    if (d.eligibility?.status === "pass") strengths.push("청약 자격이 있어요");
    if (d.transfer?.status === "tradable") strengths.push("바로 거래할 수 있어요");

    if (minCash != null && cash != null && cash > minCash)
      weaknesses.push(`현금이 ${formatKoreanMoney(cash - minCash)} 더 필요해요`);
    if (multi && rank > minRank) weaknesses.push("정착까지 더 오래 걸려요");
    if (d.eligibility?.status === "unknown") weaknesses.push("청약 자격이 불확실해요");
    if (d.eligibility?.status === "fail") weaknesses.push("청약 자격이 안 돼요");
    if (fit >= 0 && fit < recMin && fit !== maxFit)
      weaknesses.push("우리 조건 적합도가 낮은 편이에요");
    for (const inc of d.risk.incompleteInputs) weaknesses.push(`${inc} 상태예요`);

    return {
      id: c.strategy.id,
      label: c.strategy.label,
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3),
    };
  });
}

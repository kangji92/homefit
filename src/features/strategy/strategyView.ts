// /strategy 화면의 표현(presentation) 헬퍼 + 보드 조립. 도메인은 순수하게 두고
// 라벨·정렬·색 매핑만 여기서 한다. (docs/design/housing-strategy.md §5, §7~8)

import {
  computeStrategyDecision,
  generateStrategies,
  type StrategyInput,
} from "@/domain/strategy";
import { currentHomeComparison, regionSoftBoost } from "@/domain/currentHousing";
import type {
  CurrentHomeComparison,
  DecisionStatus,
  Home,
  Horizon,
  HousingStrategy,
  StrategyDecision,
  StrategyKind,
  StrategyStepKind,
} from "@/domain/types";

export interface StrategyBoardItem {
  strategy: HousingStrategy;
  decision: StrategyDecision;
  /** 현재 집 대비 변화(현재 주거가 있을 때만). HomeFit과 분리된 별도 결과. */
  comparison?: CurrentHomeComparison;
}

// presentation label만 사용자 친화적으로 분리(도메인 enum은 그대로). "추천 랭킹"처럼
// 보이지 않게 서술형으로. (housing-strategy.md §17.4 status 표현)
export const STATUS_META: Record<
  DecisionStatus,
  { label: string; className: string; rank: number }
> = {
  recommended: { label: "조건이 잘 맞아요", className: "bg-success/10 text-success", rank: 0 },
  consider: { label: "검토해볼 만해요", className: "bg-primary/10 text-primary", rank: 1 },
  needs_review: { label: "확인이 필요해요", className: "bg-warning/10 text-warning", rank: 2 },
  blocked: { label: "현재 조건에선 어려워요", className: "bg-muted text-muted-foreground", rank: 3 },
};

export const KIND_LABEL: Record<StrategyKind, string> = {
  buy_existing: "지금 매수",
  apply_presale: "청약",
  rent_then_apply: "전세 후 청약",
  buy_presale_right: "분양권 매수",
};

export const HORIZON_LABEL: Record<Horizon, string> = {
  now: "지금",
  short: "1~2년 내",
  mid: "3~4년 내",
  long: "5년 이상",
};

export const STEP_LABEL: Record<StrategyStepKind, string> = {
  buy: "매수",
  rent: "전세 거주",
  apply: "청약",
  wait: "대기",
  move_in: "입주",
};

const KIND_ORDER: StrategyKind[] = [
  "buy_existing",
  "apply_presale",
  "rent_then_apply",
  "buy_presale_right",
];
const HORIZON_RANK: Record<Horizon, number> = { now: 0, short: 1, mid: 2, long: 3 };

/** 전략의 정착 대상 상세로 가는 경로(단지 또는 개발예정지). */
export function strategyTargetHref(strategy: HousingStrategy): string | undefined {
  const ref = strategy.targetRef;
  if (!ref) return undefined;
  return ref.kind === "area" ? `/area/${ref.id}` : `/complex/${ref.id}`;
}

/**
 * 비교 매트릭스 열 선정: kind별 최상위 1개(정렬된 보드 기준)만 골라 서로 다른
 * "주거 전략 종류"를 나란히 둔다(랭킹이 아니라 종류 비교). kind 표준 순서.
 */
export function pickCompareColumns(board: StrategyBoardItem[]): StrategyBoardItem[] {
  const bestByKind = new Map<StrategyKind, StrategyBoardItem>();
  for (const item of board) {
    if (!bestByKind.has(item.strategy.kind)) bestByKind.set(item.strategy.kind, item);
  }
  return KIND_ORDER.map((k) => bestByKind.get(k)).filter(
    (x): x is StrategyBoardItem => x !== undefined,
  );
}

/**
 * 카드 목록의 1차 grouping을 **전략 종류(strategy-first)**로 묶는다. status는
 * 카드 배지로 보여, 랭킹 앱이 아니라 "어떤 주거 전략인가"를 전면에 둔다.
 * (housing-strategy.md §17 grouping 결정)
 */
export function groupByKind(
  board: StrategyBoardItem[],
): { kind: StrategyKind; items: StrategyBoardItem[] }[] {
  return KIND_ORDER.map((kind) => ({
    kind,
    items: board.filter((b) => b.strategy.kind === kind),
  })).filter((g) => g.items.length > 0);
}

/**
 * "지금 가장 먼저 확인할 것" — 보드 전체에서 실제 라우트로 이어지는 행동만 모은다
 * (fake CTA 금지). 홈 상단 체크리스트용. (housing-strategy.md §17.4)
 */
export function firstChecks(board: StrategyBoardItem[]): { label: string; href: string }[] {
  const has = (pred: (b: StrategyBoardItem) => boolean) => board.some(pred);
  const out: { label: string; href: string }[] = [];
  if (has((b) => b.decision.eligibility != null))
    out.push({ label: "청약 자격 확인하기", href: "/profile" });
  if (has((b) => b.decision.risk.incompleteInputs.some((i) => i.includes("전세"))))
    out.push({ label: "전세 후보 찾기", href: "/explore" });
  if (has((b) => b.strategy.kind === "buy_presale_right" && b.decision.affordability.verdict !== "ok"))
    out.push({ label: "분양권 필요현금 확인", href: "/strategy" });
  return out;
}

/** 축별 "우세"(강조용) — 종합점수가 아니라 각 축의 극값만. 없으면 undefined. */
export interface CompareHighlights {
  bestFitId?: string; // 적합도 최고
  lowestCashId?: string; // 지금 필요현금 최저
  soonestId?: string; // 정착 最速
}
export function compareHighlights(cols: StrategyBoardItem[]): CompareHighlights {
  const h: CompareHighlights = {};
  let bestFit = -1;
  let lowCash = Infinity;
  let soonest = Infinity;
  for (const { strategy, decision } of cols) {
    const fit = decision.fit?.totalScore ?? -1;
    if (fit > bestFit) {
      bestFit = fit;
      h.bestFitId = strategy.id;
    }
    const cash = decision.affordability.cashNeededNow;
    if (cash != null && cash < lowCash) {
      lowCash = cash;
      h.lowestCashId = strategy.id;
    }
    const rank = HORIZON_RANK[decision.timing.horizon];
    if (rank < soonest) {
      soonest = rank;
      h.soonestId = strategy.id;
    }
  }
  return h;
}

/** 전략 생성 → Decision 산출 → (현재 주거 있으면)변화 비교 → 정렬한 보드. 순수.
 *  정렬: status → HomeFit → 지역 soft boost(preferred/nearby) 순의 tiebreak. */
export function buildStrategyBoard(input: StrategyInput): StrategyBoardItem[] {
  const current = input.currentHousing;
  const currentHome =
    current?.homeRef && current.homeRef.kind !== "area"
      ? input.homes.find((h) => h.id === current.homeRef!.id)
      : undefined;

  const targetHomeOf = (s: HousingStrategy): Home | undefined =>
    s.targetRef && s.targetRef.kind !== "area"
      ? input.homes.find((h) => h.id === s.targetRef!.id)
      : undefined;

  return generateStrategies(input)
    .map((strategy) => {
      const target = targetHomeOf(strategy);
      const comparison =
        current && target
          ? currentHomeComparison({
              current,
              currentHome,
              candidate: target,
              candidateDealType: input.conditions.dealType,
              workplaces: input.conditions.workplaces,
            })
          : undefined;
      return { strategy, decision: computeStrategyDecision(strategy, input), comparison };
    })
    .sort((a, b) => {
      const byStatus =
        STATUS_META[a.decision.status].rank - STATUS_META[b.decision.status].rank;
      if (byStatus !== 0) return byStatus;
      const byFit = (b.decision.fit?.totalScore ?? 0) - (a.decision.fit?.totalScore ?? 0);
      if (byFit !== 0) return byFit;
      const boost = (s: HousingStrategy) => {
        const t = targetHomeOf(s);
        return t ? regionSoftBoost(t.regionId, { current, prefs: input.regionPrefs }) : 0;
      };
      return boost(b.strategy) - boost(a.strategy);
    });
}

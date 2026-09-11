// 현재 집 ↔ 후보 비교 (순수·결정적). 새 종합점수를 만들지 않고 HomeFit과도 섞지
// 않는다. 각 축의 현재/후보 값과 변화 방향(gain/tradeoff/neutral)만 산출한다.
// (docs/design/current-housing.md §4)

import type {
  CurrentHomeComparison,
  CurrentHousing,
  DealType,
  Home,
  HousingDelta,
  Workplace,
} from "../types";
import { regionMoveNote } from "./region";

const eok = (manwon: number) => `${(manwon / 10000).toFixed(1)}억`;
const repPyeong = (h: Home) => (h.sizesPyeong.length ? Math.max(...h.sizesPyeong) : undefined);
const buildYear = (h: Home) => (h.kind === "existing" ? h.completionYear : h.moveInYear);
const repPrice = (h: Home, deal: DealType) =>
  (deal === "sale" ? h.price.sale : h.price.jeonse)?.representative;
const tenureLabel: Record<CurrentHousing["tenure"], string> = {
  owner: "자가", jeonse: "전세", monthly_rent: "월세", family: "가족 거주", other: "기타",
};

export interface CurrentHomeComparisonInput {
  current: CurrentHousing;
  /** homeRef가 데이터와 매칭된 경우의 현재 단지(면적·통근·연식 비교용). */
  currentHome?: Home;
  candidate: Home;
  candidateDealType: DealType;
  workplaces: Workplace[];
}

export function currentHomeComparison(
  input: CurrentHomeComparisonInput,
): CurrentHomeComparison {
  const { current, currentHome, candidate, candidateDealType: deal, workplaces } = input;
  const rows: HousingDelta[] = [];
  const push = (r: HousingDelta) => rows.push(r);

  // 1) 주거 형태 (neutral)
  push({
    key: "tenure",
    label: "주거 형태",
    current: tenureLabel[current.tenure],
    candidate: deal === "sale" ? "자가(매수)" : "전세",
    change: `${tenureLabel[current.tenure]}→${deal === "sale" ? "자가" : "전세"}`,
    direction: "neutral",
  });

  // 2) 필요 자금 — 현재 보증금(전세/월세) vs 후보 대표가
  const curCash = current.tenure === "jeonse" || current.tenure === "monthly_rent" ? current.deposit : undefined;
  const candCash = repPrice(candidate, deal);
  push({
    key: "cash",
    label: "필요 자금",
    current: curCash != null ? eok(curCash) : undefined,
    candidate: candCash != null ? eok(candCash) : undefined,
    change:
      curCash != null && candCash != null
        ? candCash > curCash ? "현금 부담 증가" : candCash < curCash ? "현금 부담 감소" : "비슷"
        : undefined,
    direction:
      curCash != null && candCash != null
        ? candCash > curCash ? "tradeoff" : candCash < curCash ? "gain" : "neutral"
        : "neutral",
  });

  // 3) 면적
  const curPy = currentHome ? repPyeong(currentHome) : undefined;
  const candPy = repPyeong(candidate);
  if (curPy != null && candPy != null) {
    const d = candPy - curPy;
    push({
      key: "size", label: "면적",
      current: `${curPy}평`, candidate: `${candPy}평`,
      change: d === 0 ? "동일" : `${d > 0 ? "+" : ""}${d}평`,
      direction: d > 0 ? "gain" : d < 0 ? "tradeoff" : "neutral",
    });
  }

  // 4) 통근 (사람별)
  if (currentHome) {
    for (const wp of workplaces) {
      if (!wp.id) continue;
      const cur = currentHome.commuteMinutes[wp.id];
      const cand = candidate.commuteMinutes[wp.id];
      if (cur == null || cand == null) continue;
      const d = cand - cur;
      push({
        key: `commute:${wp.id}`, label: `${wp.label} 통근`,
        current: `${cur}분`, candidate: `${cand}분`,
        change: d === 0 ? "동일" : `${d > 0 ? "+" : ""}${d}분`,
        direction: d < 0 ? "gain" : d > 0 ? "tradeoff" : "neutral",
      });
    }
  }

  // 5) 준공/연식
  const curYear = currentHome ? buildYear(currentHome) : undefined;
  const candYear = buildYear(candidate);
  if (curYear != null && candYear != null && curYear !== candYear) {
    const d = candYear - curYear;
    push({
      key: "year", label: "준공",
      current: `${curYear}`, candidate: `${candYear}`,
      change: d > 0 ? `${d}년 신축` : `${-d}년 구축`,
      direction: d > 0 ? "gain" : "tradeoff",
    });
  }

  // 6) 역거리
  const curDist = currentHome?.kind === "existing" ? currentHome.stationDistanceM : currentHome?.stationDistanceM;
  const candDist = candidate.kind === "existing" ? candidate.stationDistanceM : candidate.stationDistanceM;
  if (curDist != null && candDist != null && curDist !== candDist) {
    const d = candDist - curDist;
    push({
      key: "station", label: "역거리",
      current: `${curDist}m`, candidate: `${candDist}m`,
      change: d < 0 ? `${-d}m 가까움` : `${d}m 멂`,
      direction: d < 0 ? "gain" : "tradeoff",
    });
  }

  // 7) 생활권
  const move = regionMoveNote(candidate.regionId, current);
  if (move !== "unknown") {
    push({
      key: "region", label: "생활권",
      current: current.regionRef?.label ?? "현재", candidate: move === "stay" ? "현재" : "변경",
      change: move === "stay" ? "현재 유지" : "생활권 이동",
      direction: move === "stay" ? "neutral" : "tradeoff",
    });
  }

  const phrase = (r: HousingDelta) => `${r.label}${r.change ? ` ${r.change}` : ""}`;
  return {
    hasCurrent: true,
    rows,
    gains: rows.filter((r) => r.direction === "gain").map(phrase),
    tradeoffs: rows.filter((r) => r.direction === "tradeoff").map(phrase),
  };
}

// 탐색 화면의 순수 필터·정렬 로직 (docs/design/explore-search.md §4).
// 점수는 domain의 computeFit/computeAreaFit을 재사용(재계산·재정의 금지).
// 집(HomeFit)과 지역(AreaFit)은 성격이 다른 척도라 한 목록에서 섞지 않는다.

import { computeAreaFit, computeFit, sortByFit } from "@/domain/scoring";
import {
  DEFAULT_SCORING_CONFIG,
  type ScoringConfig,
} from "@/domain/scoring/config";
import { priceBandFor } from "@/domain/price";
import type {
  Area,
  AreaFitResult,
  Dealbreakers,
  DealType,
  Home,
  Priorities,
  UserConditions,
} from "@/domain/types";
import type { Recommendation } from "@/features/home/recommend";

export type ListingKindFilter = "all" | "existing" | "presale" | "area";
export type SortKey = "fit" | "price" | "newest";

export interface SearchParams {
  q: string;
  regionId: string | "all";
  dealType: DealType;
  kind: ListingKindFilter;
  priceMax?: number; // 만원 — 대표가 이하 (집에만)
  sizeMin?: number; // 평 — 최소 평형 (집에만)
  sort: SortKey;
}

export interface SearchContext {
  conditions: UserConditions;
  priorities: Priorities;
  dealbreakers: Dealbreakers;
  config?: ScoringConfig;
}

export interface SearchResults {
  homes: Recommendation[];
  areas: { area: Area; fit: AreaFitResult }[];
}

export const DEFAULT_SEARCH_PARAMS: Omit<SearchParams, "dealType"> = {
  q: "",
  regionId: "all",
  kind: "all",
  sort: "fit",
};

function nameMatches(name: string, q: string): boolean {
  const needle = q.trim().toLowerCase();
  return needle === "" || name.toLowerCase().includes(needle);
}

/** 집의 정렬 기준 연도(준공/입주). */
function homeYear(home: Home): number {
  return home.kind === "existing" ? home.completionYear : home.moveInYear;
}

function includesKindHome(kind: ListingKindFilter, home: Home): boolean {
  if (kind === "all") return true;
  return kind === home.kind;
}

export function searchListings(
  homes: Home[],
  areas: Area[],
  params: SearchParams,
  ctx: SearchContext,
): SearchResults {
  const config = ctx.config ?? DEFAULT_SCORING_CONFIG;
  // 탐색 필터의 거래유형을 점수에도 반영(매매/전세 전환).
  const conditions: UserConditions = {
    ...ctx.conditions,
    dealType: params.dealType,
  };

  // ── 집 ──────────────────────────────────────────────
  const filteredHomes = homes.filter((home) => {
    if (!includesKindHome(params.kind, home)) return false;
    if (params.kind === "area") return false;
    if (!nameMatches(home.name, params.q)) return false;
    if (params.regionId !== "all" && home.regionId !== params.regionId)
      return false;

    if (params.priceMax !== undefined) {
      const band = priceBandFor(home.price, params.dealType);
      // 매물 정보 없음(band 없음)은 초과가 아니므로 통과시킨다.
      if (band && band.representative > params.priceMax) return false;
    }
    if (params.sizeMin !== undefined) {
      const maxSize = Math.max(...home.sizesPyeong, 0);
      if (maxSize < params.sizeMin) return false;
    }
    return true;
  });

  const scored = filteredHomes.map((complex) => ({
    complex,
    fit: computeFit(conditions, ctx.priorities, ctx.dealbreakers, complex, config),
  }));

  const homeResults = sortHomes(scored, params.sort, params.dealType);

  // ── 개발 예정지 (가격/평형/거래유형 필터 미적용) ──────
  const areaResults = areas
    .filter((area) => {
      if (params.kind !== "all" && params.kind !== "area") return false;
      if (!nameMatches(area.name, params.q)) return false;
      if (params.regionId !== "all" && area.regionId !== params.regionId)
        return false;
      return true;
    })
    .map((area) => ({ area, fit: computeAreaFit(ctx.priorities, area) }))
    .sort((a, b) => b.fit.totalScore - a.fit.totalScore);

  return { homes: homeResults, areas: areaResults };
}

function sortHomes(
  scored: Recommendation[],
  sort: SortKey,
  dealType: DealType,
): Recommendation[] {
  if (sort === "fit") {
    const byId = new Map(scored.map((p) => [p.complex.id, p]));
    return sortByFit(scored.map((p) => p.fit))
      .map((f) => byId.get(f.complexId))
      .filter((p): p is Recommendation => p !== undefined);
  }
  const rows = [...scored];
  if (sort === "price") {
    // 대표가 오름차순, 매물 정보 없는 집은 뒤로.
    return rows.sort((a, b) => {
      const pa = priceBandFor(a.complex.price, dealType)?.representative;
      const pb = priceBandFor(b.complex.price, dealType)?.representative;
      if (pa === undefined && pb === undefined) return 0;
      if (pa === undefined) return 1;
      if (pb === undefined) return -1;
      return pa - pb;
    });
  }
  // newest — 준공/입주 연도 내림차순
  return rows.sort((a, b) => homeYear(b.complex) - homeYear(a.complex));
}

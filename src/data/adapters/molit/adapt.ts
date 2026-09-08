// 국토부 raw item → 도메인 PriceBand. **순수 변환·대표가 산정 규칙**(테스트 대상).
// 도메인 타입만 import한다(반대 방향 의존 없음).
// (docs/design/data-phase2-1-transactions-poc.md §4)

import type { PriceBand } from "@/domain/types";
import type { MolitRentItemRaw, MolitTradeItemRaw } from "./types";

export interface AdaptOptions {
  /** 기준월 YYYYMM (인자 주입 — Date.now() 금지) */
  asOfYm: number;
  /** 매칭할 실제 아파트명 */
  aptName: string;
  /** 최근 몇 개월 (기본 6, 없으면 12로 확장) */
  windowMonths?: number;
}

/** "미사강변 센트럴자이(1단지)" → "미사강변센트럴자이1단지" */
export function normalizeAptName(s: string | undefined): string {
  return (s ?? "").replace(/[\s()·・\-_,.]/g, "");
}

function matchesApt(itemName: string | undefined, target: string): boolean {
  const a = normalizeAptName(itemName);
  const b = normalizeAptName(target);
  return a.length > 0 && (a === b || a.includes(b) || b.includes(a));
}

/** " 90,000" → 90000, 이상값 → null */
export function parseAmountManwon(raw: string | undefined): number | null {
  if (raw == null) return null;
  const n = Number(raw.replace(/[,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function itemYm(i: { dealYear?: string; dealMonth?: string }): number | null {
  const y = Number(i.dealYear);
  const m = Number(i.dealMonth);
  if (!Number.isInteger(y) || !Number.isInteger(m) || m < 1 || m > 12) return null;
  return y * 100 + m;
}

/** itemYm이 asOfYm 기준 최근 months개월(포함) 안인가 */
function withinWindow(ym: number, asOfYm: number, months: number): boolean {
  const idx = Math.floor(ym / 100) * 12 + ((ym % 100) - 1);
  const aIdx = Math.floor(asOfYm / 100) * 12 + ((asOfYm % 100) - 1);
  return idx <= aIdx && idx > aIdx - months;
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const n = s.length;
  const mid = Math.floor(n / 2);
  return n % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

function bandFromAmounts(amounts: number[]): PriceBand | undefined {
  if (amounts.length === 0) return undefined;
  return {
    representative: median(amounts),
    min: Math.min(...amounts),
    max: Math.max(...amounts),
  };
}

/** 최근 windowMonths(부족하면 12) 안의 금액만 수집 */
function recentAmounts<T extends { dealYear?: string; dealMonth?: string }>(
  items: T[],
  asOfYm: number,
  windowMonths: number,
  amountOf: (i: T) => number | null,
): number[] {
  const collect = (months: number) =>
    items
      .filter((i) => {
        const ym = itemYm(i);
        return ym != null && withinWindow(ym, asOfYm, months);
      })
      .map(amountOf)
      .filter((n): n is number => n != null);

  const primary = collect(windowMonths);
  return primary.length > 0 ? primary : collect(12);
}

/** 매매 대표가 밴드 (거래 0건 → undefined) */
export function toSalePriceBand(
  items: MolitTradeItemRaw[],
  opts: AdaptOptions,
): PriceBand | undefined {
  const { asOfYm, aptName, windowMonths = 6 } = opts;
  const matched = items.filter((i) => matchesApt(i.aptNm, aptName));
  const amounts = recentAmounts(matched, asOfYm, windowMonths, (i) =>
    parseAmountManwon(i.dealAmount),
  );
  return bandFromAmounts(amounts);
}

/** 전세(순수 전세=월세 0) 보증금 밴드 (0건 → undefined) */
export function toJeonsePriceBand(
  items: MolitRentItemRaw[],
  opts: AdaptOptions,
): PriceBand | undefined {
  const { asOfYm, aptName, windowMonths = 6 } = opts;
  const matched = items.filter(
    (i) => matchesApt(i.aptNm, aptName) && Number(i.monthlyRent) === 0,
  );
  const amounts = recentAmounts(matched, asOfYm, windowMonths, (i) =>
    parseAmountManwon(i.deposit),
  );
  return bandFromAmounts(amounts);
}

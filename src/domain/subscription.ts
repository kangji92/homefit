// 청약 일정 파생 (순수 함수). today는 인자 주입 — 결정성 유지(Date.now 금지).

import type { Home, PresaleHome } from "./types";

const DAY_MS = 86400000;

/** dateISO(YYYY-MM-DD)까지 todayISO 기준 남은 일수(과거면 음수). */
export function dDay(dateISO: string, todayISO: string): number {
  const d = Date.parse(`${dateISO}T00:00:00Z`);
  const t = Date.parse(`${todayISO}T00:00:00Z`);
  if (Number.isNaN(d) || Number.isNaN(t)) return NaN;
  return Math.round((d - t) / DAY_MS);
}

export interface UpcomingSubscription {
  home: PresaleHome;
  date: string;
  dDay: number;
}

/** 분양 단지를 청약 공고일 오름차순으로 정렬한 목록. */
export function upcomingSubscriptions(
  homes: Home[],
  todayISO: string,
): UpcomingSubscription[] {
  return homes
    .filter(
      (h): h is PresaleHome =>
        h.kind === "presale" && !!h.subscription?.announcementDate,
    )
    .map((h) => {
      const date = h.subscription!.announcementDate!;
      return { home: h, date, dDay: dDay(date, todayISO) };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

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

/** 청약 소식(공지) 종류: 공고 예정 / 오늘 공고 / 최근 공고됨. */
export type SubscriptionNoticeKind = "scheduled" | "today" | "new";
export interface SubscriptionNotice {
  home: PresaleHome;
  date: string;
  dDay: number;
  kind: SubscriptionNoticeKind;
}

/**
 * 청약 "소식/공지" — 최근/임박 모집공고만 추린 피드(전체 일정 목록과 별개, 하이라이트용).
 * 오늘 기준 ±windowDays 이내 공고를 최신순으로. (변경 field-diff는 인제스트 이력 축적 후 별도.)
 */
export function subscriptionNotices(
  homes: Home[],
  todayISO: string,
  windowDays = 21,
): SubscriptionNotice[] {
  return homes
    .filter(
      (h): h is PresaleHome =>
        h.kind === "presale" && !!h.subscription?.announcementDate,
    )
    .map((h) => {
      const date = h.subscription!.announcementDate!;
      const d = dDay(date, todayISO);
      const kind: SubscriptionNoticeKind = d > 0 ? "scheduled" : d === 0 ? "today" : "new";
      return { home: h, date, dDay: d, kind };
    })
    .filter((n) => !Number.isNaN(n.dDay) && Math.abs(n.dDay) <= windowDays)
    .sort((a, b) => b.date.localeCompare(a.date)); // 최신 공고 먼저
}

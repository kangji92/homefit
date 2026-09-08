// 청약홈 raw → 도메인 공고 레코드(AdaptedAnnouncement). 완전한 PresaleHome이
// 아니라 청약홈이 줄 수 있는 슬라이스(lifecycle·일정·입주·근거)만. metrics·통근·
// 분양가는 다른 소스와 repository에서 병합한다. (presale-rights.md §8,§10)

import type { PresaleLifecycle, PresalePhase, Provenance } from "@/domain/types";
import type { ApplyhomeAptRaw } from "./types";

// ── lifecycle 파생 (co-located: adapter 체인에 런타임 sibling import를 두지 않아
//    strip-types 스크립트에서도 import 가능). 청약홈은 전매제한/전매 시점을 주지
//    않으므로 transfer_restricted/transferable은 여기서 단정하지 않는다(§12-3).
export interface ScheduleDates {
  recruitDate?: string; // 모집공고일 YYYY-MM-DD
  receiptBegin?: string; // 접수 시작
  receiptEnd?: string; // 접수 종료
  moveInYm?: string; // 입주 예정월 YYYYMM
}

function firstOfMonth(ym?: string): string | undefined {
  if (!ym || ym.length < 6) return undefined;
  return `${ym.slice(0, 4)}-${ym.slice(4, 6)}-01`;
}

/** 청약 일정 날짜 → phase 결정적 파생. today 주입. */
export function deriveLifecyclePhase(
  d: ScheduleDates,
  today: string,
): PresalePhase {
  const moveIn = firstOfMonth(d.moveInYm);
  if (moveIn && today >= moveIn) return "occupied";
  if (d.recruitDate && today < d.recruitDate) return "planned";
  if (d.receiptBegin && today < d.receiptBegin) return "subscription_scheduled";
  if (d.receiptEnd && today <= d.receiptEnd) return "subscription_open";
  return "subscription_closed";
}

/** 청약홈 기여분 — repository가 metrics·통근·가격과 병합해 PresaleHome 완성 */
export interface AdaptedAnnouncement {
  id: string;
  name: string;
  areaName?: string; // 공급지역(시/도) — region 매칭 전
  address?: string;
  moveInYear?: number;
  households?: number;
  lifecycle: PresaleLifecycle;
  subscription: { announcementDate?: string; scheduleNote?: string };
  provenance: Provenance;
}

function num(v: number | string | undefined): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function scheduleNote(raw: ApplyhomeAptRaw): string | undefined {
  const parts: string[] = [];
  if (raw.RCEPT_BGNDE && raw.RCEPT_ENDDE)
    parts.push(`접수 ${raw.RCEPT_BGNDE}~${raw.RCEPT_ENDDE}`);
  if (raw.PRZWNER_PRESNATN_DE) parts.push(`당첨발표 ${raw.PRZWNER_PRESNATN_DE}`);
  return parts.length ? parts.join(" · ") : undefined;
}

/** raw 1건 → 공고 레코드. today 주입(결정적). */
export function adaptAptDetail(
  raw: ApplyhomeAptRaw,
  today: string,
): AdaptedAnnouncement {
  const id = `applyhome-${raw.PBLANC_NO ?? raw.HOUSE_MANAGE_NO ?? "unknown"}`;
  const moveInYm = raw.MVN_PREARNGE_YM;

  const provenance: Provenance = {
    sourceType: "official_announcement",
    sourceId: raw.PBLANC_NO,
    sourceUrl: raw.PBLANC_URL,
    lastVerifiedAt: today,
    verificationStatus: "verified",
  };

  const lifecycle: PresaleLifecycle = {
    phase: deriveLifecyclePhase(
      {
        recruitDate: raw.RCRIT_PBLANC_DE,
        receiptBegin: raw.RCEPT_BGNDE,
        receiptEnd: raw.RCEPT_ENDDE,
        moveInYm,
      },
      today,
    ),
    phaseSince: raw.RCRIT_PBLANC_DE,
    lastVerifiedAt: today,
    source: provenance,
  };

  return {
    id,
    name: raw.HOUSE_NM ?? id,
    areaName: raw.SUBSCRPT_AREA_CODE_NM,
    address: raw.HSSPLY_ADRES,
    moveInYear: moveInYm ? num(moveInYm.slice(0, 4)) : undefined,
    households: num(raw.TOT_SUPLY_HSHLDCO),
    lifecycle,
    subscription: {
      announcementDate: raw.RCRIT_PBLANC_DE,
      scheduleNote: scheduleNote(raw),
    },
    provenance,
  };
}

export function adaptAptList(
  raws: ApplyhomeAptRaw[],
  today: string,
): AdaptedAnnouncement[] {
  return raws.map((r) => adaptAptDetail(r, today));
}

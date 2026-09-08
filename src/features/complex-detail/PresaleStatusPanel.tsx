"use client";

import type { Money, PresaleHome, PresalePhase } from "@/domain/types";
import {
  availableAcquisitionPaths,
  computeCashFlow,
  deriveTransactionRisk,
} from "@/domain/presale";
import { formatKoreanMoney } from "@/lib/format";

const PHASE_LABEL: Record<PresalePhase, string> = {
  planned: "분양 예정",
  subscription_scheduled: "청약 예정",
  subscription_open: "청약 접수 중",
  subscription_closed: "청약 종료",
  transfer_restricted: "전매제한 중",
  transferable: "전매 가능",
  occupied: "입주",
};

const PATH_LABEL: Record<string, string> = {
  subscription: "청약",
  resale: "분양권 거래",
  existing_trade: "기존 매매",
};

const FLAG_LABEL: Record<string, string> = {
  transfer_restricted: "전매제한 중",
  transferability_unconfirmed: "거래 가능 여부 확인 불가",
  listing_mismatch: "공식 정보와 매물 설명 불일치",
  rights_check_needed: "권리관계 추가 확인 필요",
  price_source_unclear: "가격 출처 불명확",
  stale_info: "정보 오래됨(재확인)",
  title_transfer_unconfirmed: "명의변경 확인 필요",
};

/** 전매 신호등 — §9.2. unknown/needs_review는 🟢로 표시하지 않는다. */
function transferSignal(home: PresaleHome) {
  const t = home.transfer;
  if (!t) return { emoji: "⚪", text: "공식 정보 확인 필요", cls: "text-muted-foreground" };
  const risk = deriveTransactionRisk(t);
  if (t.status === "restricted")
    return { emoji: "🔴", text: "전매제한 중", cls: "text-danger" };
  if (
    risk === "normal" &&
    t.status === "tradable" &&
    t.provenance.sourceType === "official_announcement"
  )
    return { emoji: "🟢", text: "현재 전매 가능", cls: "text-fit-high" };
  if (t.status === "conditional" || risk === "needs_review")
    return { emoji: "🟡", text: "조건 확인 필요", cls: "text-warning" };
  return { emoji: "⚪", text: "공식 정보 확인 필요", cls: "text-muted-foreground" };
}

function PriceRow({ label, money }: { label: string; money?: Money }) {
  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={money ? "font-medium" : "text-muted-foreground"}>
        {money ? formatKoreanMoney(money.manwon) : "— 확인 필요"}
      </span>
    </li>
  );
}

export function PresaleStatusPanel({ home }: { home: PresaleHome }) {
  const phase = home.lifecycle?.phase;
  const paths = availableAcquisitionPaths(home);
  const signal = transferSignal(home);
  const cf = home.offering ? computeCashFlow(home.offering) : undefined;
  const src = home.transfer?.provenance ?? home.lifecycle?.source;

  return (
    <section className="bg-surface border-border rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">취득 상태</h2>
        {phase && (
          <span className="bg-surface-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
            {PHASE_LABEL[phase]}
          </span>
        )}
      </div>

      {/* 전매 신호등 */}
      <p className={`mt-2 text-sm font-medium ${signal.cls}`}>
        {signal.emoji} {signal.text}
      </p>
      {home.transfer?.restrictionEndDate && home.transfer.status !== "tradable" && (
        <p className="text-muted-foreground mt-1 text-xs">
          {home.transfer.restrictionReason ?? "전매제한"} ·{" "}
          {home.transfer.restrictionEndDate} 종료 예정
        </p>
      )}
      {(signal.emoji === "🟡" || signal.emoji === "⚪") && (
        <p className="text-muted-foreground mt-1 text-xs">
          공식 공고 및 관계기관 확인이 필요해요.
        </p>
      )}

      {/* 취득 경로 */}
      {paths.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {paths.map((p) => (
            <li
              key={p}
              className="bg-primary/10 text-primary rounded px-1.5 py-0.5 text-xs font-medium"
            >
              {PATH_LABEL[p] ?? p} 가능
            </li>
          ))}
        </ul>
      )}

      {/* 위험 신호 */}
      {home.transfer && home.transfer.riskFlags.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {home.transfer.riskFlags.map((f) => (
            <li
              key={f}
              className="bg-danger/10 text-danger rounded px-1.5 py-0.5 text-xs"
            >
              {FLAG_LABEL[f] ?? f}
            </li>
          ))}
        </ul>
      )}

      {/* 가격 · 현금흐름 */}
      {home.offering && (
        <ul className="border-border mt-3 space-y-1 border-t pt-3">
          <PriceRow label="분양가" money={home.offering.basePrice} />
          <PriceRow label="분양권 거래가" money={home.offering.resalePrice} />
          <PriceRow label="프리미엄" money={cf?.premium} />
          <PriceRow label="지금 필요한 현금" money={cf?.cashNeededAtPurchase} />
          <PriceRow label="최종 예상 취득금액" money={cf?.estimatedTotalAcquisition} />
        </ul>
      )}

      {src && (
        <p className="text-muted-foreground mt-3 text-xs">
          {src.lastVerifiedAt} 기준
          {src.sourceUrl && (
            <>
              {" · "}
              <a
                href={src.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline"
              >
                공고 보기
              </a>
            </>
          )}{" "}
          · 실제 자격·순위는 공식 공고로 확인하세요.
        </p>
      )}
    </section>
  );
}

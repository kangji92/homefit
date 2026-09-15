"use client";

import { useState } from "react";
import type { Home, Money } from "@/domain/types";
import type { DevelopmentArea, MemberSaleEstimate } from "@/domain/development";
import {
  computeRedevelopmentCost,
  computeRedevelopmentCostRange,
  isRateSuspiciouslyHigh,
  isValidRate,
  percentToRate,
  sourced,
  type RedevelopmentCostEstimate,
  type RedevelopmentCostInputs,
} from "@/domain/development";
import { formatKoreanMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface RedevelopmentCostSimulatorProps {
  home: Home;
  /** 연결된 정비사업(평형별 조합원분양가·seed용). */
  area?: DevelopmentArea;
  /** 희망 평형 변경을 상위(저장소)로 반영 — 재열람 시 복원용. */
  onChangeDesiredSize?: (estimateId: string) => void;
}

const won = (manwon: number): Money => ({ manwon, valueProvenance: "user_input" });
const toManwon = (eok: string) => {
  const n = Number(eok);
  return eok.trim() !== "" && Number.isFinite(n) ? Math.round(n * 10000) : undefined;
};
const toEok = (manwon?: number) => (manwon != null ? String(manwon / 10000) : "");
// low/high가 같으면 단일, 다르면 "min ~ max".
function showRange(low?: Money, high?: Money): string {
  if (!low && !high) return "정보 없음";
  const a = low?.manwon, b = high?.manwon;
  if (a == null || b == null) return formatKoreanMoney((a ?? b)!);
  return a === b ? formatKoreanMoney(a) : `${formatKoreanMoney(a)} ~ ${formatKoreanMoney(b)}`;
}
const PRESETS = [
  { id: "conservative", label: "보수적", pct: 90 },
  { id: "base", label: "기준", pct: 100 },
  { id: "optimistic", label: "낙관적", pct: 110 },
];
const estLabel = (e?: MemberSaleEstimate) =>
  e ? `${e.sizeLabel}${e.price ? ` ${showRange(e.price.min, e.price.max)}` : " · 예정가 미확보"}` : "";

export function RedevelopmentCostSimulator({ home, area, onChangeDesiredSize }: RedevelopmentCostSimulatorProps) {
  const estimates = area?.memberSaleEstimates ?? [];
  const purchaseManwon = home.listing?.askingPrice?.manwon;
  // ⚠️ 몰래 기본값 주입 금지: 모르는 값 = 빈 문자열 → undefined. 임의 추정하지 않는다.
  const initAppraisal = home.redevelopment?.previousAssetAppraisal?.manwon;
  const initEst =
    estimates.find((e) => e.id === home.redevelopment?.desiredMemberSaleEstimateId) ??
    estimates.find((e) => e.price) ?? // 가격 있는 평형 우선
    estimates[0];

  const [presetId, setPresetId] = useState<string | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string | undefined>(initEst?.id);
  const [f, setF] = useState({
    comparison: toEok(home.listing?.recentTransactionPrice?.manwon),
    appraisal: toEok(initAppraisal),
    ratePct: "", // 모름(기본값 100% 주입 안 함)
    memberMin: toEok(initEst?.price?.min.manwon),
    memberMax: toEok(initEst?.price?.max.manwon),
    other: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const applyPreset = (id: string, pct: number) => { setPresetId(id); setF((p) => ({ ...p, ratePct: String(pct) })); };
  const applySize = (est: MemberSaleEstimate) => {
    setSelectedId(est.id);
    setF((p) => ({ ...p, memberMin: toEok(est.price?.min.manwon), memberMax: toEok(est.price?.max.manwon) }));
    onChangeDesiredSize?.(est.id);
  };
  const selected = estimates.find((e) => e.id === selectedId);

  const ratePctNum = Number(f.ratePct);
  const hasRate = f.ratePct.trim() !== "" && Number.isFinite(ratePctNum);
  const rate = hasRate ? percentToRate(ratePctNum) : undefined;
  const rateInvalid = hasRate && !isValidRate(rate!);
  const rateHigh = hasRate && isValidRate(rate!) && isRateSuspiciouslyHigh(rate!);

  const appraisalManwon = toManwon(f.appraisal);
  const otherManwon = toManwon(f.other);
  const baseInputs: RedevelopmentCostInputs = {
    purchasePrice: purchaseManwon != null ? sourced(won(purchaseManwon), "broker", { sourceLabel: "매물 호가" }) : undefined,
    comparisonPropertyValue: toManwon(f.comparison) != null ? sourced(won(toManwon(f.comparison)!), "user_input") : undefined,
    previousAssetAppraisal: appraisalManwon != null ? sourced(won(appraisalManwon), "user_input") : undefined,
    proportionalRate: rate != null && isValidRate(rate) ? sourced(rate, "user_input") : undefined,
    additionalCosts: otherManwon != null ? { other: sourced(won(otherManwon), "user_input") } : undefined,
  };
  const memberMin = toManwon(f.memberMin);
  const memberMax = toManwon(f.memberMax);
  const hasMember = memberMin != null || memberMax != null;
  // 조합원분양가가 없으면 memberSale을 넣지 않는다(분담금 미계산). 있으면 range로 2회 계산.
  const { low, high }: { low: RedevelopmentCostEstimate; high: RedevelopmentCostEstimate } = hasMember
    ? computeRedevelopmentCostRange(
        baseInputs,
        { min: won(memberMin ?? memberMax!), max: won(memberMax ?? memberMin!) },
        selected?.sourceType ?? "user_input",
      )
    : (() => { const e = computeRedevelopmentCost(baseInputs); return { low: e, high: e }; })();

  const hasRightValue = low.estimatedRightValue != null;
  const hasContribution = low.estimatedAdditionalContribution != null;
  const hasBase = low.estimatedBaseTotalCost != null;
  const hasExtra = low.additionalCostsTotal != null;

  return (
    <section className="bg-surface border-border rounded-xl border p-4" aria-label="재개발 비용 시뮬레이터">
      <h3 className="text-base font-bold">신축 취득까지 총투입액</h3>
      <p className="text-muted-foreground mt-0.5 text-[11px]">입력값 기반 계산이에요. 실제 분담금·수익률이 아니며 점수에 반영되지 않아요. 모르는 값은 비워두면 그 항목은 계산하지 않아요.</p>

      {/* ── 결과 hero: 현재 매수가가 아니라 '예상 총투입액' ── */}
      <div className="border-primary/40 bg-primary/5 mt-3 rounded-lg border p-3">
        <p className="text-muted-foreground text-xs">예상 총투입액 (신축 취득까지)</p>
        {hasBase ? (
          <p className="text-primary text-2xl font-bold">{showRange(low.estimatedAllInCost, high.estimatedAllInCost)}</p>
        ) : (
          <p className="text-muted-foreground text-sm font-semibold">계산 전 — 아래 값을 입력하면 총투입액이 나와요.</p>
        )}
      </div>

      {/* ── "왜 이 금액인가?" breakdown ── */}
      {hasBase && (
        <div className="border-border mt-2 rounded-lg border p-3">
          <p className="text-muted-foreground mb-1.5 text-xs font-semibold">왜 이 금액인가요?</p>
          <dl className="space-y-1 text-sm">
            <BreakRow label="현재 매입" value={purchaseManwon != null ? formatKoreanMoney(purchaseManwon) : "정보 없음"} />
            <BreakRow label="예상 분담금" value={`+ ${showRange(low.estimatedAdditionalContribution, high.estimatedAdditionalContribution)}`} />
            <div className="border-border border-t pt-1">
              <BreakRow label="기본 총투입" value={showRange(low.estimatedBaseTotalCost, high.estimatedBaseTotalCost)} strong />
            </div>
            {hasExtra && (
              <>
                <BreakRow label="+ 기타비용" value={low.additionalCostsTotal ? formatKoreanMoney(low.additionalCostsTotal.manwon) : ""} />
                <div className="border-border border-t pt-1">
                  <BreakRow label="전체 총투입" value={showRange(low.estimatedAllInCost, high.estimatedAllInCost)} strong />
                </div>
              </>
            )}
          </dl>
        </div>
      )}

      <div className="mt-3 flex gap-1.5">
        {PRESETS.map((p) => (
          <button key={p.id} type="button" onClick={() => applyPreset(p.id, p.pct)} aria-pressed={presetId === p.id}
            className={cn("rounded-full border px-3 py-1 text-xs font-medium", presetId === p.id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}>
            비례율 {p.label}
          </button>
        ))}
      </div>

      {/* 희망 평형 선택(연결된 사업의 조합원 예정분양가) */}
      {estimates.length > 0 && (
        <div className="mt-3">
          <p className="text-muted-foreground mb-1 text-xs">희망 신축 평형 (예정 조합원분양가)</p>
          <div className="flex flex-wrap gap-1.5">
            {estimates.map((est) => (
              <button key={est.id} type="button" onClick={() => applySize(est)} aria-pressed={selectedId === est.id}
                className={cn("rounded-full border px-2.5 py-1 text-xs", selectedId === est.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>
                {estLabel(est)}
              </button>
            ))}
          </div>
          {selected && !selected.price && (
            <p className="text-muted-foreground mt-1 text-[11px]">※ 이 평형은 예정분양가가 확보되지 않았어요. 아래에 직접 입력하면 계산해요.</p>
          )}
          {selected?.price && selected.verification && selected.verification !== "verified" && (
            <p className="text-warning mt-1 text-[11px]">※ {selected.verification === "reported" ? "2차 자료" : "미확인(중개사 등)"} — 공식값 아님. 직접 수정 가능해요.</p>
          )}
        </div>
      )}

      <Group title="① 현재 매수">
        <ReadRow label="호가" value={home.listing?.askingPrice ? formatKoreanMoney(home.listing.askingPrice.manwon) : "정보 없음"} />
        <EditRow label="비교 기준가(억)" value={f.comparison} onChange={set("comparison")} hint="시장 프리미엄 계산용(선택)" />
        <ReadRow label="시장 프리미엄" value={low.marketPremium ? `${formatKoreanMoney(low.marketPremium.manwon)}${low.marketPremiumRate != null ? ` (+${(low.marketPremiumRate * 100).toFixed(0)}%)` : ""}` : "계산 전"} hint="시장 프리미엄 ≠ 권리가액" />
      </Group>

      <Group title="② 정비사업 추정">
        <EditRow label="종전자산평가액(억)" value={f.appraisal} onChange={set("appraisal")} hint="모르면 비워두세요" />
        <EditRow label="비례율(%)" value={f.ratePct} onChange={set("ratePct")} hint="모르면 비워두세요" warn={rateInvalid ? "0보다 커야 해요" : rateHigh ? "비정상적으로 높아요" : undefined} />
        <ReadRow label="예상 권리가액" value={hasRightValue ? formatKoreanMoney(low.estimatedRightValue!.manwon) : "계산 전"} hint={hasRightValue ? "= 종전자산 × 비례율" : "종전자산평가액과 비례율을 입력해주세요"} />
        <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
          <span className="text-muted-foreground text-xs">조합원 분양가(억) min~max</span>
          <span className="flex gap-1">
            <input aria-label="조합원분양가 최소(억)" className="border-border bg-surface w-16 rounded-md border px-2 py-1 text-right text-sm" inputMode="decimal" value={f.memberMin} onChange={set("memberMin")} />
            <input aria-label="조합원분양가 최대(억)" className="border-border bg-surface w-16 rounded-md border px-2 py-1 text-right text-sm" inputMode="decimal" value={f.memberMax} onChange={set("memberMax")} />
          </span>
        </div>
        <ReadRow label="예상 추가분담금" value={hasContribution ? showRange(low.estimatedAdditionalContribution, high.estimatedAdditionalContribution) : "계산 전"} hint={hasContribution ? "= 조합원분양가 − 권리가액" : "권리가액과 조합원분양가가 필요합니다"} />
      </Group>

      <Group title="③ 최종">
        <EditRow label="기타비용(억)" value={f.other} onChange={set("other")} hint="취득세·중개·금융 등 합계(선택)" />
        <ReadRow label="예상 기본 총투입액" value={hasBase ? showRange(low.estimatedBaseTotalCost, high.estimatedBaseTotalCost) : "계산 전"} hint={hasBase ? "= 매수가 + 추가분담금" : "매수가와 추가분담금이 필요합니다"} />
      </Group>

      {/* ── 불확실성/출처 요약 ── */}
      <div className="border-border mt-3 rounded-lg border p-3">
        <p className="text-muted-foreground mb-1.5 text-xs font-semibold">값의 출처</p>
        <dl className="space-y-0.5 text-xs">
          <SourceRow label="종전자산평가액" src={appraisalManwon != null ? "사용자 입력" : "미입력"} />
          <SourceRow label="비례율" src={rate != null && isValidRate(rate) ? "사용자 입력" : "미입력"} />
          <SourceRow
            label={`${selected?.sizeLabel ?? "평형"} 예정분양가`}
            src={
              !hasMember
                ? "미입력"
                : selected?.price
                  ? `${selected.sourceLabel ?? "현장 자료"}${selected.verification === "verified" ? " · 확인" : " · 미검증"}`
                  : "사용자 직접 입력"
            }
          />
          {area && (
            <SourceRow
              label="사업단계"
              src={`${area.name}${area.verification === "verified" ? " · 공식·확인됨" : " · 미확인"}`}
            />
          )}
        </dl>
        <p className="text-muted-foreground mt-2 text-[11px]">실제 분담금은 관리처분계획 및 조합의 공식 자료에 따라 달라질 수 있어요.</p>
      </div>
    </section>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <p className="text-muted-foreground mb-1 text-xs font-semibold">{title}</p>
      <dl className="border-border divide-y rounded-lg border">{children}</dl>
    </div>
  );
}
function ReadRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between px-3 py-2 text-sm">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-right font-medium">{value}{hint && <span className="text-muted-foreground block text-[11px] font-normal">{hint}</span>}</dd>
    </div>
  );
}
function EditRow({ label, value, onChange, hint, warn }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; hint?: string; warn?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
      <label className="text-muted-foreground text-xs">
        {label}
        {hint && <span className="block text-[11px]">{hint}</span>}
        {warn && <span className="text-warning block text-[11px]">{warn}</span>}
      </label>
      <input type="number" inputMode="decimal" value={value} onChange={onChange} aria-label={label}
        className="border-border bg-surface w-24 rounded-md border px-2 py-1 text-right text-sm" />
    </div>
  );
}
function BreakRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className={cn("text-xs", strong ? "font-semibold" : "text-muted-foreground")}>{label}</dt>
      <dd className={cn("text-right", strong ? "text-primary font-bold" : "font-medium")}>{value}</dd>
    </div>
  );
}
function SourceRow({ label, src }: { label: string; src: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{src}</dd>
    </div>
  );
}

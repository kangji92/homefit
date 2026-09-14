"use client";

import { useState } from "react";
import type { Home, Money } from "@/domain/types";
import type { DevelopmentArea, MemberSaleEstimate } from "@/domain/development";
import {
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

export function RedevelopmentCostSimulator({ home, area }: RedevelopmentCostSimulatorProps) {
  const estimates = area?.memberSaleEstimates ?? [];
  const purchaseManwon = home.listing?.askingPrice?.manwon;
  const seededAppraisal = home.redevelopment?.previousAssetAppraisal?.manwon ?? 60000;
  const firstEst = estimates[0];

  const [presetId, setPresetId] = useState("base");
  const [sizeLabel, setSizeLabel] = useState<string | undefined>(firstEst?.sizeLabel);
  const [f, setF] = useState({
    comparison: toEok(home.listing?.recentTransactionPrice?.manwon) || "6",
    appraisal: toEok(seededAppraisal),
    ratePct: "100",
    memberMin: toEok(firstEst?.price.min.manwon) || "10",
    memberMax: toEok(firstEst?.price.max.manwon) || "10",
    other: "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }));

  const applyPreset = (id: string, pct: number) => { setPresetId(id); setF((p) => ({ ...p, ratePct: String(pct) })); };
  const applySize = (est: MemberSaleEstimate) => {
    setSizeLabel(est.sizeLabel);
    setF((p) => ({ ...p, memberMin: toEok(est.price.min.manwon), memberMax: toEok(est.price.max.manwon) }));
  };

  const ratePctNum = Number(f.ratePct);
  const hasRate = f.ratePct.trim() !== "" && Number.isFinite(ratePctNum);
  const rate = hasRate ? percentToRate(ratePctNum) : undefined;
  const rateInvalid = hasRate && !isValidRate(rate!);
  const rateHigh = hasRate && isValidRate(rate!) && isRateSuspiciouslyHigh(rate!);

  const otherManwon = toManwon(f.other);
  const baseInputs: RedevelopmentCostInputs = {
    purchasePrice: purchaseManwon != null ? sourced(won(purchaseManwon), "broker", { sourceLabel: "매물 호가" }) : undefined,
    comparisonPropertyValue: toManwon(f.comparison) != null ? sourced(won(toManwon(f.comparison)!), "user_input") : undefined,
    previousAssetAppraisal: toManwon(f.appraisal) != null ? sourced(won(toManwon(f.appraisal)!), "user_input") : undefined,
    proportionalRate: rate != null && isValidRate(rate) ? sourced(rate, "user_input") : undefined,
    additionalCosts: otherManwon != null ? { other: sourced(won(otherManwon), "user_input") } : undefined,
  };
  const min = toManwon(f.memberMin) ?? 0;
  const max = toManwon(f.memberMax) ?? min;
  const { low, high }: { low: RedevelopmentCostEstimate; high: RedevelopmentCostEstimate } =
    computeRedevelopmentCostRange(baseInputs, { min: won(min), max: won(max) }, firstEst?.sourceType ?? "user_input");

  const estVerif = estimates.find((e) => e.sizeLabel === sizeLabel)?.verification;

  return (
    <section className="bg-surface border-border rounded-xl border p-4" aria-label="재개발 비용 시뮬레이터">
      <h3 className="text-base font-bold">재개발 비용 시뮬레이터</h3>
      <p className="text-muted-foreground mt-0.5 text-[11px]">입력/mock 기반 계산이에요. 실제 분담금·수익률이 아니며 점수에 반영되지 않아요.</p>

      <div className="mt-3 flex gap-1.5">
        {PRESETS.map((p) => (
          <button key={p.id} type="button" onClick={() => applyPreset(p.id, p.pct)} aria-pressed={presetId === p.id}
            className={cn("rounded-full border px-3 py-1 text-xs font-medium", presetId === p.id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}>
            {p.label}
          </button>
        ))}
      </div>

      {/* 평형 선택(연결된 사업의 조합원 예정분양가) */}
      {estimates.length > 0 && (
        <div className="mt-3">
          <p className="text-muted-foreground mb-1 text-xs">평형별 조합원 예정분양가</p>
          <div className="flex flex-wrap gap-1.5">
            {estimates.map((est) => (
              <button key={est.sizeLabel} type="button" onClick={() => applySize(est)} aria-pressed={sizeLabel === est.sizeLabel}
                className={cn("rounded-full border px-2.5 py-1 text-xs", sizeLabel === est.sizeLabel ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>
                {est.sizeLabel} {showRange(est.price.min, est.price.max)}
              </button>
            ))}
          </div>
          {estVerif && estVerif !== "verified" && (
            <p className="text-warning mt-1 text-[11px]">※ {estVerif === "reported" ? "2차 자료" : "미확인(중개사 등)"} — 공식값 아님. 직접 수정 가능해요.</p>
          )}
        </div>
      )}

      <Group title="① 현재 매수">
        <ReadRow label="호가" value={home.listing?.askingPrice ? formatKoreanMoney(home.listing.askingPrice.manwon) : "정보 없음"} />
        <EditRow label="비교 기준가(억)" value={f.comparison} onChange={set("comparison")} />
        <ReadRow label="시장 프리미엄" value={low.marketPremium ? `${formatKoreanMoney(low.marketPremium.manwon)}${low.marketPremiumRate != null ? ` (+${(low.marketPremiumRate * 100).toFixed(0)}%)` : ""}` : "정보 없음"} hint="시장 프리미엄 ≠ 권리가액" />
      </Group>

      <Group title="② 정비사업 추정">
        <EditRow label="종전자산평가액(억)" value={f.appraisal} onChange={set("appraisal")} />
        <EditRow label="비례율(%)" value={f.ratePct} onChange={set("ratePct")} warn={rateInvalid ? "0보다 커야 해요" : rateHigh ? "비정상적으로 높아요" : undefined} />
        <ReadRow label="예상 권리가액" value={low.estimatedRightValue ? formatKoreanMoney(low.estimatedRightValue.manwon) : "정보 없음"} hint="= 종전자산 × 비례율" />
        <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
          <span className="text-muted-foreground text-xs">조합원 분양가(억) min~max</span>
          <span className="flex gap-1">
            <input aria-label="조합원분양가 최소(억)" className="border-border bg-surface w-16 rounded-md border px-2 py-1 text-right text-sm" inputMode="decimal" value={f.memberMin} onChange={set("memberMin")} />
            <input aria-label="조합원분양가 최대(억)" className="border-border bg-surface w-16 rounded-md border px-2 py-1 text-right text-sm" inputMode="decimal" value={f.memberMax} onChange={set("memberMax")} />
          </span>
        </div>
        <ReadRow label="예상 추가분담금" value={showRange(low.estimatedAdditionalContribution, high.estimatedAdditionalContribution)} hint="= 조합원분양가 − 권리가액" />
      </Group>

      <Group title="③ 최종">
        <EditRow label="기타비용(억)" value={f.other} onChange={set("other")} hint="취득세·중개·금융 등 합계(선택)" />
        <ReadRow label="예상 기본 총투입액" value={showRange(low.estimatedBaseTotalCost, high.estimatedBaseTotalCost)} hint="= 매수가 + 추가분담금" />
      </Group>
      <div className="border-primary/40 bg-primary/5 mt-2 rounded-lg border p-3">
        <p className="text-muted-foreground text-xs">예상 전체 총투입액 (기본 + 기타비용)</p>
        <p className="text-primary text-xl font-bold">{showRange(low.estimatedAllInCost, high.estimatedAllInCost)}</p>
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

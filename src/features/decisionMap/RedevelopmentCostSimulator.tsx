"use client";

import { useState } from "react";
import type { Home, Money } from "@/domain/types";
import {
  computeRedevelopmentCost,
  computeScenarios,
  isRateSuspiciouslyHigh,
  isValidRate,
  percentToRate,
  sourced,
  type RedevelopmentCostInputs,
} from "@/domain/development";
import { mockRedevelopmentScenarios } from "@/data/mock/redevelopmentScenarios";
import { formatKoreanMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface RedevelopmentCostSimulatorProps {
  home: Home;
}

const won = (manwon: number): Money => ({ manwon, valueProvenance: "user_input" });
const toManwon = (eok: string) => {
  const n = Number(eok);
  return eok.trim() !== "" && Number.isFinite(n) ? Math.round(n * 10000) : undefined;
};
const toEok = (manwon?: number) => (manwon != null ? String(manwon / 10000) : "");
const showMoney = (m?: Money) => (m ? formatKoreanMoney(m.manwon) : "정보 없음");

interface Form {
  comparison: string;
  appraisal: string;
  ratePct: string;
  memberSale: string;
  other: string;
}

function scenarioToForm(inputs: RedevelopmentCostInputs): Form {
  return {
    comparison: toEok(inputs.comparisonPropertyValue?.value.manwon),
    appraisal: toEok(inputs.previousAssetAppraisal?.value.manwon),
    ratePct: inputs.proportionalRate ? String(inputs.proportionalRate.value * 100) : "",
    memberSale: toEok(inputs.memberSalePrice?.value.manwon),
    other: "",
  };
}

export function RedevelopmentCostSimulator({ home }: RedevelopmentCostSimulatorProps) {
  const scenarios = mockRedevelopmentScenarios(home);
  const purchaseManwon = home.listing?.askingPrice?.manwon;
  const [activePreset, setActivePreset] = useState("base");
  const [form, setForm] = useState<Form>(() =>
    scenarioToForm((scenarios.find((s) => s.id === "base") ?? scenarios[0]).inputs),
  );

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const applyPreset = (id: string) => {
    const s = scenarios.find((x) => x.id === id);
    if (!s) return;
    setActivePreset(id);
    setForm(scenarioToForm(s.inputs));
  };

  const ratePct = Number(form.ratePct);
  const hasRate = form.ratePct.trim() !== "" && Number.isFinite(ratePct);
  const rate = hasRate ? percentToRate(ratePct) : undefined;
  const rateInvalid = hasRate && !isValidRate(rate!);
  const rateHigh = hasRate && isValidRate(rate!) && isRateSuspiciouslyHigh(rate!);

  const otherManwon = toManwon(form.other);
  const inputs: RedevelopmentCostInputs = {
    purchasePrice: purchaseManwon != null ? sourced(won(purchaseManwon), "mock", { sourceLabel: "매물 호가(mock)" }) : undefined,
    comparisonPropertyValue: toManwon(form.comparison) != null ? sourced(won(toManwon(form.comparison)!), "user_input") : undefined,
    previousAssetAppraisal: toManwon(form.appraisal) != null ? sourced(won(toManwon(form.appraisal)!), "user_input") : undefined,
    proportionalRate: rate != null && isValidRate(rate) ? sourced(rate, "user_input") : undefined,
    memberSalePrice: toManwon(form.memberSale) != null ? sourced(won(toManwon(form.memberSale)!), "user_input") : undefined,
    additionalCosts: otherManwon != null ? { other: sourced(won(otherManwon), "user_input") } : undefined,
  };
  const est = computeRedevelopmentCost(inputs);
  const presetResults = computeScenarios(scenarios);

  const contribution = est.estimatedAdditionalContribution;
  const contributionText =
    contribution == null
      ? "정보 없음"
      : est.contributionBalance === "surplus"
        ? `계산상 권리가액 초과 ${formatKoreanMoney(Math.abs(contribution.manwon))}`
        : `예상 추가분담금 ${formatKoreanMoney(contribution.manwon)}`;

  return (
    <section className="bg-surface border-border rounded-xl border p-4" aria-label="재개발 비용 시뮬레이터">
      <h3 className="text-base font-bold">재개발 비용 시뮬레이터</h3>
      <p className="text-muted-foreground mt-0.5 text-[11px]">
        전부 mock/입력값 기반 계산이에요. 실제 분담금·수익률이 아니며 점수에 반영되지 않아요.
      </p>

      {/* 프리셋 */}
      <div className="mt-3 flex gap-1.5">
        {scenarios.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => applyPreset(s.id)}
            aria-pressed={activePreset === s.id}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              activePreset === s.id ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ① 현재 매수 */}
      <Group title="① 현재 매수">
        <ReadRow label="호가" value={showMoney(home.listing?.askingPrice)} />
        <EditRow label="비교 기준가(억)" value={form.comparison} onChange={set("comparison")} />
        <ReadRow label="시장 프리미엄" value={est.marketPremium ? `${formatKoreanMoney(est.marketPremium.manwon)}${est.marketPremiumRate != null ? ` (+${(est.marketPremiumRate * 100).toFixed(0)}%)` : ""}` : "정보 없음"} hint="시장 프리미엄 ≠ 권리가액" />
      </Group>

      {/* ② 정비사업 추정 */}
      <Group title="② 정비사업 추정">
        <EditRow label="종전자산평가액(억)" value={form.appraisal} onChange={set("appraisal")} />
        <EditRow label="비례율(%)" value={form.ratePct} onChange={set("ratePct")} warn={rateInvalid ? "0보다 커야 해요" : rateHigh ? "비정상적으로 높아요" : undefined} />
        <ReadRow label="권리가액" value={showMoney(est.estimatedRightValue)} hint="= 종전자산 × 비례율" />
        <EditRow label="조합원 분양가(억)" value={form.memberSale} onChange={set("memberSale")} />
        <ReadRow label="추가분담금" value={contributionText} hint="= 조합원분양가 − 권리가액" />
      </Group>

      {/* ③ 최종 */}
      <Group title="③ 최종">
        <ReadRow label="현재 매수가" value={showMoney(home.listing?.askingPrice)} />
        <ReadRow label="예상 추가분담금" value={contribution ? formatKoreanMoney(contribution.manwon) : "정보 없음"} />
        <EditRow label="기타비용(억)" value={form.other} onChange={set("other")} hint="취득세·중개·금융 등 합계(선택)" />
        <ReadRow label="예상 기본 총투입액" value={showMoney(est.estimatedBaseTotalCost)} hint="= 매수가 + 추가분담금" />
      </Group>
      <div className="border-primary/40 bg-primary/5 mt-2 rounded-lg border p-3">
        <p className="text-muted-foreground text-xs">예상 전체 총투입액 (기본 + 기타비용)</p>
        <p className="text-primary text-xl font-bold">{showMoney(est.estimatedAllInCost)}</p>
      </div>

      {/* 시나리오 비교 */}
      <div className="mt-4">
        <p className="text-muted-foreground mb-1 text-xs font-medium">시나리오 비교 (mock)</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[360px] text-xs">
            <thead>
              <tr className="text-muted-foreground text-left">
                <th className="py-1 font-medium">시나리오</th>
                <th className="py-1 font-medium">비례율</th>
                <th className="py-1 font-medium">권리가액</th>
                <th className="py-1 font-medium">추가분담금</th>
                <th className="py-1 font-medium">기본 총투입</th>
              </tr>
            </thead>
            <tbody>
              {presetResults.map(({ scenario, estimate }) => (
                <tr key={scenario.id} className="border-border border-t">
                  <td className="py-1">{scenario.label}</td>
                  <td className="py-1">{scenario.inputs.proportionalRate ? `${scenario.inputs.proportionalRate.value * 100}%` : "—"}</td>
                  <td className="py-1">{showMoney(estimate.estimatedRightValue)}</td>
                  <td className="py-1">{showMoney(estimate.estimatedAdditionalContribution)}</td>
                  <td className="py-1 font-medium">{showMoney(estimate.estimatedBaseTotalCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      <dd className="text-right font-medium">
        {value}
        {hint && <span className="text-muted-foreground block text-[11px] font-normal">{hint}</span>}
      </dd>
    </div>
  );
}

function EditRow({
  label,
  value,
  onChange,
  hint,
  warn,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hint?: string;
  warn?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
      <label className="text-muted-foreground text-xs">
        {label}
        {hint && <span className="block text-[11px]">{hint}</span>}
        {warn && <span className="text-warning block text-[11px]">{warn}</span>}
      </label>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={onChange}
        aria-label={label}
        className="border-border bg-surface w-24 rounded-md border px-2 py-1 text-right text-sm"
      />
    </div>
  );
}

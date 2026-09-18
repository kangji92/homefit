import type { SubscriptionConditions } from "@/domain/types";

const REG_LABEL: Record<NonNullable<SubscriptionConditions["regulatedArea"]>, string> = {
  none: "비규제지역",
  adjustment: "조정대상지역",
  speculation_overheated: "투기과열지구",
};
const yn = (b?: boolean) => (b === undefined ? "공고 확인" : b ? "필요" : "불필요");

/**
 * 청약 공고 자격·제한 조건(무주택·청약통장·거주요건·전매·실거주·재당첨). 확인 안 된 값은
 * "공고 확인"으로 정직하게 — 임의 추정하지 않는다. (docs/design/presale-rights.md)
 */
export function SubscriptionConditionsPanel({ conditions: c }: { conditions: SubscriptionConditions }) {
  const rows: { label: string; value: string }[] = [];
  if (c.regulatedArea) rows.push({ label: "규제지역", value: REG_LABEL[c.regulatedArea] });
  rows.push({ label: "무주택 요건", value: yn(c.homelessRequired) });
  rows.push({
    label: "청약통장",
    value: c.subscriptionAccount
      ? c.subscriptionAccount.required
        ? `필요${c.subscriptionAccount.minMonths ? ` · ${c.subscriptionAccount.minMonths}개월↑` : ""}`
        : "불필요"
      : "공고 확인",
  });
  rows.push({
    label: "해당지역 거주",
    value: c.localResidency
      ? c.localResidency.required
        ? `필요${c.localResidency.months ? ` · ${c.localResidency.months}개월` : " · 기간 공고 확인"}`
        : "불필요"
      : "공고 확인",
  });
  rows.push({ label: "전매제한", value: c.resaleRestrictionMonths == null ? "공고 확인" : `${c.resaleRestrictionMonths}개월` });
  rows.push({ label: "실거주 의무", value: c.mandatoryResidenceMonths == null ? "공고 확인" : `${c.mandatoryResidenceMonths}개월` });
  rows.push({ label: "재당첨 제한", value: c.rewinLimit === undefined ? "공고 확인" : c.rewinLimit ? "적용" : "미적용" });

  return (
    <section className="bg-surface border-border rounded-xl border p-4" aria-label="청약 공고 조건">
      <h2 className="font-semibold">청약 공고 조건</h2>
      <dl className="border-border mt-2 divide-y rounded-lg border text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between px-3 py-2">
            <dt className="text-muted-foreground text-xs">{r.label}</dt>
            <dd className="text-right font-medium">{r.value}</dd>
          </div>
        ))}
      </dl>
      {c.note && <p className="text-muted-foreground mt-2 text-[11px]">{c.note}</p>}
      <p className="text-muted-foreground mt-1 text-[11px]">
        정확한 조건·수치는 입주자모집공고 기준으로 확인하세요.
      </p>
    </section>
  );
}

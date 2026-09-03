"use client";

import type { HouseholdProfile } from "@/domain/types";
import { evaluatePrograms } from "@/domain/eligibility/programs";
import { DEFAULT_SUBSCRIPTION_POLICY } from "@/domain/eligibility/policy";
import { whatIf } from "@/domain/eligibility/whatif";

interface Props {
  profile: HouseholdProfile;
}

const cardCls = "border-border bg-surface rounded-lg border p-4";

export function EligibilityOverview({ profile }: Props) {
  const programs = evaluatePrograms(profile);
  const eligible = programs.filter((p) => p.eligible);
  const unlockable = whatIf(profile);
  const asOf = programs[0]?.asOf;
  const policyVersion = programs[0]?.policyVersion;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">내 청약 가능성</h2>

      {/* 현재 가능 */}
      <div className={cardCls}>
        <p className="text-sm font-medium">지금 신청할 수 있는 청약</p>
        {eligible.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">
            입력한 조건으로 지금 바로 되는 특별공급은 없어요. 아래 “이렇게 하면
            열려요”를 확인해 보세요.
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {eligible.map((p) => (
              <li key={p.key} className="text-sm">
                <span className="text-primary font-medium">✓ {p.name}</span>
                {p.allowsOwnHome && (
                  <span className="text-muted-foreground"> · 유주택도 가능</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 이렇게 하면 열림 */}
      {unlockable.length > 0 && (
        <div className={cardCls}>
          <p className="text-sm font-medium">이렇게 하면 열려요</p>
          <ul className="mt-2 space-y-3">
            {unlockable.map((r) => (
              <li key={r.scenario.key}>
                <p className="text-sm font-medium">{r.scenario.label}</p>
                <ul className="mt-1 space-y-0.5">
                  {r.unlocked.map((p) => (
                    <li
                      key={p.key}
                      className="text-muted-foreground text-sm"
                    >
                      → {p.name}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-muted-foreground text-xs leading-relaxed">
        {DEFAULT_SUBSCRIPTION_POLICY.source} 기준(적용 {asOf} · 정책{" "}
        {policyVersion}). 소득요건은 도시근로자 월평균소득 × 비율로 계산해요.
        일부 가구원수 소득값·세대/사실혼 판정은 단순화돼 있으니, 실제 자격·순위는
        청약 공고로 확인하세요.
      </p>
    </section>
  );
}

import Link from "next/link";
import { evaluatePrograms } from "@/domain/eligibility";
import { DEFAULT_SUBSCRIPTION_POLICY } from "@/domain/eligibility/policy";
import type { HouseholdProfile } from "@/domain/types";
import { cn } from "@/lib/utils";

const STATUS_MARK = { pass: "✓", fail: "✕", unknown: "⚠️" } as const;
// 특별공급 전 유형(신혼→생애최초→다자녀→노부모→신생아). general/unranked은 특공 아님.
const SPECIAL_KEYS = ["newlywed", "firstTime", "multiChild", "oldParent", "newborn"];

function badgeFor(p: { eligible: boolean; hasUnknown: boolean }) {
  return p.eligible
    ? { text: "가능성 있음", cls: "bg-fit-high/10 text-fit-high" }
    : p.hasUnknown
      ? { text: "판정 전", cls: "bg-surface-muted text-muted-foreground" }
      : { text: "요건 미충족", cls: "bg-danger/10 text-danger" };
}

/**
 * 청약 자격 — **특별공급 전 유형**을 내 가구 프로필 기준으로 판정(단지·공고 무관). 적합도 점수와
 * 직교. 소득/자산은 정책(청약홈 청약제도안내 2025) 버전드. (docs/design/…household-eligibility)
 */
export function EligibilityPanel({ profile }: { profile: HouseholdProfile }) {
  const programs = evaluatePrograms(profile).filter((p) => SPECIAL_KEYS.includes(p.key));
  const anyUnknown = programs.some((p) => p.hasUnknown);
  const asOf = programs[0]?.asOf;
  const policyVersion = programs[0]?.policyVersion;

  return (
    <section className="bg-surface border-border rounded-xl border p-4" aria-label="청약 자격">
      <h2 className="font-semibold">내 청약 자격 · 특별공급</h2>
      <p className="text-muted-foreground mt-0.5 text-[11px]">
        내 가구 조건 기준(단지·공고와 무관). 이 단지의 특공 물량·소득기준은 공고를 확인하세요.
      </p>

      <div className="mt-3 space-y-3">
        {programs.map((p) => {
          const badge = badgeFor(p);
          return (
            <div key={p.key} className="border-border rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{p.name}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", badge.cls)}>{badge.text}</span>
              </div>
              <ul className="mt-1.5 space-y-1 text-sm">
                {p.requirements.map((r) => (
                  <li key={r.key} className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-xs">{r.label}</span>
                    <span
                      className={cn(
                        "shrink-0 text-xs",
                        r.status === "pass" && "text-fit-high",
                        r.status === "fail" && "text-danger",
                        r.status === "unknown" && "text-warning",
                      )}
                    >
                      {STATUS_MARK[r.status]}
                      {r.detail ? ` ${r.detail}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
              {p.note && <p className="text-muted-foreground mt-1.5 text-[11px]">{p.note}</p>}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {anyUnknown && (
          <Link href="/profile" className="text-primary inline-block text-sm font-medium">
            가구 프로필 채우고 판정받기 →
          </Link>
        )}
        <Link href="/subscription-guide" className="text-primary inline-block text-sm font-medium">
          청약 자격 안내 자세히 →
        </Link>
      </div>

      <p className="text-muted-foreground mt-3 text-xs">
        {DEFAULT_SUBSCRIPTION_POLICY.source} 기준(적용 {asOf} · 정책 {policyVersion}). 실제 자격·순위는 청약 공고 기준으로 확인하세요.
      </p>
    </section>
  );
}

import Link from "next/link";
import { evaluateNewlywedSpecial } from "@/domain/eligibility";
import type { HouseholdProfile } from "@/domain/types";
import { cn } from "@/lib/utils";

const STATUS_MARK = { pass: "✓", fail: "✕", unknown: "⚠️" } as const;

// 청약 자격 — 적합도 점수와 분리된 패널(직교). 정책 버전드·mock 고지.
export function EligibilityPanel({ profile }: { profile: HouseholdProfile }) {
  const e = evaluateNewlywedSpecial(profile);

  const badge = e.eligible
    ? { text: "가능성 있음", cls: "bg-fit-high/10 text-fit-high" }
    : e.hasUnknown
      ? { text: "판정 전", cls: "bg-surface-muted text-muted-foreground" }
      : { text: "요건 미충족", cls: "bg-danger/10 text-danger" };

  return (
    <section className="bg-surface border-border rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">청약 자격 · {e.program}</h2>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", badge.cls)}>
          {badge.text}
        </span>
      </div>

      <ul className="mt-2 space-y-1 text-sm">
        {e.requirements.map((r) => (
          <li key={r.key} className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">{r.label}</span>
            <span
              className={cn(
                "shrink-0",
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

      {e.hasUnknown && (
        <Link
          href="/profile"
          className="text-primary mt-3 inline-block text-sm font-medium"
        >
          가구 프로필 채우고 판정받기 →
        </Link>
      )}

      <p className="text-muted-foreground mt-3 text-xs">
        기준일 {e.asOf} · 정책 {e.policyVersion} · 참고용 테스트 데이터예요(실제
        자격은 청약 공고 기준으로 확인하세요).
      </p>
    </section>
  );
}

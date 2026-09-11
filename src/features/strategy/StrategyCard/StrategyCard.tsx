import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatKoreanMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StatusBadge } from "../StatusBadge";
import { strategyNarrative } from "../narrative";
import {
  HORIZON_LABEL,
  strategyTargetHref,
  type StrategyBoardItem,
} from "../strategyView";

export interface StrategyCardProps {
  item: StrategyBoardItem;
}

const ELIG_LABEL = { pass: "가능", fail: "불가", unknown: "확인 필요" } as const;

/** "지금 실행 가능?" — 실행가능성을 한 단어로. */
function executableLabel(item: StrategyBoardItem): string {
  const { status } = item.decision;
  if (status === "blocked") return "어려움";
  const v = item.decision.affordability.verdict;
  if (v === "short") return "자금 부족";
  if (v === "unknown") return "확인 필요";
  return "가능";
}

/**
 * 전략 Decision을 "결정 서사" 우선순위로 보여준다: 무엇 → 왜 → 실행가능 → 돈 →
 * 시점 → 장점 → 제약 → 모르는 것 → 다음 행동 → (보조) HomeFit.
 * HomeFit은 결론이 아니라 근거 중 하나로 맨 아래에 둔다. (housing-strategy.md §17.1)
 */
export function StrategyCard({ item }: StrategyCardProps) {
  const { strategy, decision, comparison } = item;
  const { fit, affordability, timing, eligibility, transfer, risk } = decision;
  const targetHref = strategyTargetHref(strategy);
  const targetIsArea = strategy.targetRef?.kind === "area";

  // 실제 라우트로만 연결되는 다음 행동(fake CTA 금지).
  const ctas: { label: string; href: string }[] = [];
  if (eligibility) ctas.push({ label: "청약 자격 확인", href: "/profile" });
  if (risk.incompleteInputs.some((i) => i.includes("전세")))
    ctas.push({ label: "전세 후보 찾기", href: "/explore" });

  return (
    <article className="bg-surface border-border rounded-xl border p-4">
      {/* 1) 무엇 · 상태  2) 왜 */}
      <StatusBadge status={decision.status} />
      <h3 className="mt-1.5 text-base font-bold leading-snug">{strategy.label}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{strategyNarrative(item)}</p>

      {/* 현재 집 대비 변화 — "옮기면 무엇이 달라지는가" (HomeFit과 분리) */}
      {comparison && (comparison.gains.length > 0 || comparison.tradeoffs.length > 0) && (
        <div className="border-border mt-3 grid grid-cols-2 gap-2 rounded-lg border p-2.5 text-sm">
          <div>
            <p className="text-muted-foreground mb-1 text-[11px] font-medium">옮겨서 얻는 것</p>
            <ul className="space-y-0.5">
              {comparison.gains.length ? (
                comparison.gains.map((g) => (
                  <li key={g} className="text-foreground text-xs">
                    <span className="text-success">✓</span> {g}
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground text-xs">—</li>
              )}
            </ul>
          </div>
          <div>
            <p className="text-muted-foreground mb-1 text-[11px] font-medium">포기하는 것</p>
            <ul className="space-y-0.5">
              {comparison.tradeoffs.length ? (
                comparison.tradeoffs.map((t) => (
                  <li key={t} className="text-muted-foreground text-xs">
                    <span className="text-warning">△</span> {t}
                  </li>
                ))
              ) : (
                <li className="text-muted-foreground text-xs">—</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* 3~5) 실행가능 · 돈 · 시점 · 자격 (핵심 사실) */}
      <dl className="border-border mt-3 divide-y rounded-lg border text-sm">
        <FactRow label="지금 실행" value={executableLabel(item)} />
        <FactRow
          label="필요 현금"
          value={affordability.cashNeededNow != null ? formatKoreanMoney(affordability.cashNeededNow) : "—"}
        />
        <FactRow
          label="정착 예상"
          value={
            HORIZON_LABEL[timing.horizon] + (timing.settleBy ? ` · ${timing.settleBy}년` : "")
          }
        />
        {eligibility && (
          <FactRow
            label="청약 자격"
            value={ELIG_LABEL[eligibility.status]}
            hint={eligibility.program}
          />
        )}
        {transfer && (
          <FactRow
            label="전매"
            value={
              transfer.status === "tradable"
                ? "거래 가능"
                : transfer.status === "restricted"
                  ? "전매제한"
                  : "조건부"
            }
          />
        )}
      </dl>

      {/* 6) 왜 고려? */}
      {decision.pros.length > 0 && (
        <Block title="왜 고려?">
          {decision.pros.map((p) => (
            <li key={p} className="text-foreground text-sm">
              <span className="text-success">✓</span> {p}
            </li>
          ))}
        </Block>
      )}

      {/* 7) 주의할 점 (제약 + 확인 필요) */}
      {(decision.cons.length > 0 || risk.requiredReviews.length > 0) && (
        <Block title="주의할 점">
          {decision.cons.map((c) => (
            <li key={c} className="text-muted-foreground text-sm">
              <span className="text-warning">△</span> {c}
            </li>
          ))}
          {risk.requiredReviews.map((r) => (
            <li key={r} className="text-muted-foreground text-sm">
              <span className="text-warning">△</span> {r}
            </li>
          ))}
        </Block>
      )}

      {/* 8) 아직 모르는 것 */}
      {risk.incompleteInputs.length > 0 && (
        <Block title="아직 정하지 않은 항목">
          {risk.incompleteInputs.map((u) => (
            <li key={u} className="text-muted-foreground text-sm">
              · {u}
            </li>
          ))}
        </Block>
      )}

      {/* 9) 다음 행동 — 실제 라우트 */}
      {(ctas.length > 0 || targetHref) && (
        <div className="mt-4 space-y-2">
          {targetHref && (
            <Link
              href={targetHref}
              className="bg-primary text-primary-foreground flex items-center justify-center rounded-lg py-2 text-sm font-semibold"
            >
              {targetIsArea ? "개발예정지 상세 보기" : "대상 단지 상세 보기"}
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          )}
          {ctas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ctas.map((c) => (
                <Link
                  key={c.href}
                  href={c.href}
                  className="border-border text-primary rounded-lg border px-3 py-1.5 text-sm font-medium"
                >
                  {c.label} →
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 10) 보조 지표: HomeFit — 결론 아님, 근거 중 하나 */}
      {fit && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-muted-foreground text-[11px]">주택 적합도</span>
          <div className="bg-surface-muted h-1.5 flex-1 overflow-hidden rounded-full">
            <div
              className={cn("h-full rounded-full", fit.totalScore >= 67 ? "bg-fit-high" : fit.totalScore >= 34 ? "bg-fit-medium" : "bg-fit-low")}
              style={{ width: `${Math.max(0, Math.min(100, fit.totalScore))}%` }}
            />
          </div>
          <span className="text-muted-foreground text-[11px] tabular-nums">
            HomeFit {fit.totalScore}
          </span>
        </div>
      )}
    </article>
  );
}

function FactRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between px-3 py-2">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-right font-medium">
        {value}
        {hint && <span className="text-muted-foreground block text-[11px] font-normal">{hint}</span>}
      </dd>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <p className="text-muted-foreground mb-1 text-xs font-medium">{title}</p>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

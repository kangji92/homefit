import Link from "next/link";
import { formatKoreanMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { StatusBadge } from "../StatusBadge";
import {
  HORIZON_LABEL,
  KIND_LABEL,
  compareHighlights,
  strategyTargetHref,
  type StrategyBoardItem,
} from "../strategyView";

export interface StrategyCompareTableProps {
  columns: StrategyBoardItem[];
}

const ELIG_LABEL = { pass: "가능", fail: "불가", unknown: "확인 필요" } as const;
const VERDICT_LABEL = { ok: "감당 가능", short: "부족", unknown: "확인 필요" } as const;

/**
 * 서로 다른 전략을 **동일 축**으로 나란히 비교한다. 종합점수로 줄세우지 않고,
 * 각 축의 값과 "이 축에서 유리" 표시만 준다(억지 승패 금지). (product-vision Compare)
 */
export function StrategyCompareTable({ columns }: StrategyCompareTableProps) {
  const hl = compareHighlights(columns);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="bg-background sticky left-0 z-10 w-24 p-2 text-left align-bottom text-xs font-medium text-muted-foreground">
              비교 축
            </th>
            {columns.map(({ strategy, decision }) => {
              const href = strategyTargetHref(strategy);
              return (
                <th key={strategy.id} className="min-w-[130px] p-2 align-bottom">
                  <div className="flex flex-col items-start gap-1">
                    <span className="bg-surface-muted text-muted-foreground rounded px-1.5 py-0.5 text-[11px] font-medium">
                      {KIND_LABEL[strategy.kind]}
                    </span>
                    <StatusBadge status={decision.status} />
                    {href ? (
                      <Link href={href} className="text-primary text-left text-xs font-semibold leading-snug hover:underline">
                        {strategy.label} →
                      </Link>
                    ) : (
                      <span className="text-left text-xs font-semibold leading-snug">{strategy.label}</span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <Row label="적합도">
            {columns.map((c) => (
              <Cell key={c.strategy.id} highlight={hl.bestFitId === c.strategy.id} tag={hl.bestFitId === c.strategy.id ? "최고" : undefined}>
                {c.decision.fit ? `${c.decision.fit.totalScore}점` : "—"}
              </Cell>
            ))}
          </Row>
          <Row label="감당가능성">
            {columns.map((c) => (
              <Cell key={c.strategy.id} highlight={hl.lowestCashId === c.strategy.id} tag={hl.lowestCashId === c.strategy.id ? "현금 최저" : undefined}>
                {VERDICT_LABEL[c.decision.affordability.verdict]}
                {c.decision.affordability.cashNeededNow != null && (
                  <span className="text-muted-foreground block text-[11px]">
                    현금 {formatKoreanMoney(c.decision.affordability.cashNeededNow)}
                  </span>
                )}
              </Cell>
            ))}
          </Row>
          <Row label="정착 시점">
            {columns.map((c) => (
              <Cell key={c.strategy.id} highlight={hl.soonestId === c.strategy.id} tag={hl.soonestId === c.strategy.id ? "最速" : undefined}>
                {HORIZON_LABEL[c.decision.timing.horizon]}
                {c.decision.timing.settleBy && (
                  <span className="text-muted-foreground block text-[11px]">{c.decision.timing.settleBy}년</span>
                )}
              </Cell>
            ))}
          </Row>
          <Row label="청약 자격">
            {columns.map((c) => (
              <Cell key={c.strategy.id}>
                {c.decision.eligibility ? (
                  <>
                    {ELIG_LABEL[c.decision.eligibility.status]}
                    {c.decision.eligibility.program && (
                      <span className="text-muted-foreground block text-[11px]">{c.decision.eligibility.program}</span>
                    )}
                  </>
                ) : (
                  <Muted />
                )}
              </Cell>
            ))}
          </Row>
          <Row label="전매">
            {columns.map((c) => (
              <Cell key={c.strategy.id}>
                {c.decision.transfer
                  ? c.decision.transfer.status === "tradable"
                    ? "거래 가능"
                    : c.decision.transfer.status === "restricted"
                      ? "전매제한"
                      : "조건부"
                  : <Muted />}
              </Cell>
            ))}
          </Row>
          <Row label="확인 필요">
            {columns.map((c) => (
              <Cell key={c.strategy.id}>
                {c.decision.risk.requiredReviews.length ? (
                  <span className="text-warning">{c.decision.risk.requiredReviews.length}건</span>
                ) : (
                  <span className="text-muted-foreground">없음</span>
                )}
              </Cell>
            ))}
          </Row>
          <Row label="미결정">
            {columns.map((c) => (
              <Cell key={c.strategy.id}>
                {c.decision.risk.incompleteInputs.length ? (
                  <span className="text-muted-foreground">{c.decision.risk.incompleteInputs.join(", ")}</span>
                ) : (
                  <span className="text-muted-foreground">없음</span>
                )}
              </Cell>
            ))}
          </Row>
        </tbody>
      </table>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <th scope="row" className="bg-background sticky left-0 z-10 border-t border-border p-2 text-left align-top text-xs font-medium text-muted-foreground">
        {label}
      </th>
      {children}
    </tr>
  );
}

function Cell({ children, highlight, tag }: { children: React.ReactNode; highlight?: boolean; tag?: string }) {
  return (
    <td className={cn("border-t border-border p-2 align-top", highlight && "bg-fit-high/5")}>
      <div className="font-medium">{children}</div>
      {highlight && tag && (
        <span className="bg-fit-high/10 text-fit-high mt-1 inline-block rounded px-1 py-0.5 text-[10px] font-medium">
          {tag}
        </span>
      )}
    </td>
  );
}

function Muted() {
  return <span className="text-muted-foreground">해당 없음</span>;
}

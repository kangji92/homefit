import { tradeoffSummary } from "../narrative";
import type { StrategyBoardItem } from "../strategyView";

export interface TradeoffSummaryProps {
  columns: StrategyBoardItem[];
}

/**
 * 비교 표(근거 확인용) 위에 얹는 **의사결정용** 요약. 각 전략이 무엇을 우선하고
 * 무엇을 포기하는지 사용자 언어의 +/-로 보여준다. 종합 승자는 만들지 않는다.
 * 모두 deterministic rule 기반(narrative.ts). (housing-strategy.md §17.2)
 */
export function TradeoffSummary({ columns }: TradeoffSummaryProps) {
  if (columns.length < 2) return null;
  const items = tradeoffSummary(columns);

  return (
    <section aria-label="트레이드오프 요약" className="mb-4">
      <h2 className="text-sm font-semibold">무엇을 우선하느냐의 문제예요</h2>
      <p className="text-muted-foreground mb-3 text-xs">
        종합 승자는 없어요. 각 전략이 얻는 것과 포기하는 것을 비교하세요.
      </p>
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.id} className="bg-surface border-border rounded-xl border p-3">
            <h3 className="text-sm font-semibold">{it.label}</h3>
            <ul className="mt-1.5 space-y-0.5">
              {it.strengths.map((s) => (
                <li key={s} className="text-foreground text-sm">
                  <span className="text-success">+</span> {s}
                </li>
              ))}
              {it.weaknesses.map((w) => (
                <li key={w} className="text-muted-foreground text-sm">
                  <span className="text-warning">−</span> {w}
                </li>
              ))}
              {it.strengths.length === 0 && it.weaknesses.length === 0 && (
                <li className="text-muted-foreground text-sm">뚜렷한 차이가 없어요</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

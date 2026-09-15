import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { ListCardShell } from "@/components/ui/ListCardShell";
import { DealbreakerBadge } from "@/components/ui/DealbreakerBadge";
import type { DealType } from "@/domain/types";
import { formatActivePrice } from "@/lib/format";
import { PRIORITY_LABELS } from "@/lib/priorityLabels";
import { topAxes, type Recommendation } from "./recommend";

export function RecommendationCard({
  recommendation,
  regionName,
  dealType,
  action,
}: {
  recommendation: Recommendation;
  regionName?: string;
  dealType: DealType;
  /** 카드 우상단에 얹는 액션(예: 관심 담기). 링크 이동과 분리된 슬롯. */
  action?: React.ReactNode;
}) {
  const { complex, fit } = recommendation;
  const axes = topAxes(fit, 3);

  return (
    <ListCardShell href={`/complex/${complex.id}`} action={action}>
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-primary text-xs font-semibold">검토할 이유</p>
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{complex.name}</h3>
            {!fit.passesDealbreakers && <DealbreakerBadge />}
          </div>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {regionName ? `${regionName} · ` : ""}
            {formatActivePrice(complex, dealType)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            {axes.map((a) => PRIORITY_LABELS[a.key]).join(", ")} 조건을 확인해볼 만해요.
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {axes.map((a) => (
              <li
                key={a.key}
                className="bg-surface-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs"
              >
                {PRIORITY_LABELS[a.key]} {a.score}
              </li>
            ))}
          </ul>
          </div>
          <ScoreGauge score={fit.totalScore} label="적합도" />
        </div>
    </ListCardShell>
  );
}

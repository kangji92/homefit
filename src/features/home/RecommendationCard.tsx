import Link from "next/link";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import type { DealType } from "@/domain/types";
import { formatActivePrice } from "@/lib/format";
import { PRIORITY_LABELS } from "@/lib/priorityLabels";
import { topAxes, type Recommendation } from "./recommend";

export function RecommendationCard({
  recommendation,
  regionName,
  dealType,
}: {
  recommendation: Recommendation;
  regionName?: string;
  dealType: DealType;
}) {
  const { complex, fit } = recommendation;
  const axes = topAxes(fit, 3);

  return (
    <Link
      href={`/complex/${complex.id}`}
      className="bg-surface border-border block rounded-xl border p-4"
    >
      <div className="flex items-center gap-4">
        <ScoreGauge score={fit.totalScore} label="적합도" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{complex.name}</h3>
            {!fit.passesDealbreakers && (
              <span className="bg-danger/10 text-danger shrink-0 rounded px-1.5 py-0.5 text-xs font-medium">
                조건 미충족
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {regionName ? `${regionName} · ` : ""}
            {formatActivePrice(complex, dealType)}
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
      </div>
    </Link>
  );
}

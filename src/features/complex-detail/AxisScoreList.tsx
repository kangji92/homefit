import { PRIORITY_KEYS, type PriorityKey } from "@/domain/types";
import { PRIORITY_LABELS } from "@/lib/priorityLabels";
import { cn } from "@/lib/utils";

function bandBg(score: number): string {
  if (score >= 67) return "bg-fit-high";
  if (score >= 34) return "bg-fit-medium";
  return "bg-fit-low";
}

export function AxisScoreList({
  axisScores,
}: {
  axisScores: Record<PriorityKey, number>;
}) {
  return (
    <div className="space-y-3">
      <ul className="space-y-2.5">
        {PRIORITY_KEYS.map((k) => {
          const score = axisScores[k];
          return (
            <li key={k}>
              <div className="flex items-center justify-between text-sm">
                <span>{PRIORITY_LABELS[k]}</span>
                <span className="font-medium tabular-nums">{score}</span>
              </div>
              <div className="bg-surface-muted mt-1 h-2 overflow-hidden rounded-full">
                <div
                  className={cn("h-full rounded-full", bandBg(score))}
                  style={{ width: `${score}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-muted-foreground text-xs">
        미래가치는 현재 테스트용 데이터입니다.
      </p>
    </div>
  );
}

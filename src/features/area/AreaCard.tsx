import Link from "next/link";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import type { Area, AreaFitResult } from "@/domain/types";

export function AreaCard({
  area,
  fit,
  action,
}: {
  area: Area;
  fit: AreaFitResult;
  /** 카드 우상단에 얹는 액션(예: 관심 담기). 링크 이동과 분리된 슬롯. */
  action?: React.ReactNode;
}) {
  return (
    <div className="relative">
      {action && <div className="absolute right-3 top-3 z-10">{action}</div>}
      <Link
        href={`/area/${area.id}`}
        className="bg-surface border-border block rounded-xl border p-4"
      >
        <div className="flex items-center gap-4">
        <ScoreGauge score={fit.totalScore} label="적합도" />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{area.name}</h3>
          {area.summary && (
            <p className="text-muted-foreground mt-0.5 truncate text-sm">
              {area.summary}
            </p>
          )}
          {area.targetMoveInYear && (
            <p className="text-muted-foreground mt-1 text-xs">
              {area.targetMoveInYear}년 입주 예정
            </p>
          )}
          </div>
        </div>
      </Link>
    </div>
  );
}

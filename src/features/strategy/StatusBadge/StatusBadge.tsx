import type { DecisionStatus } from "@/domain/types";
import { cn } from "@/lib/utils";
import { STATUS_META } from "../strategyView";

export interface StatusBadgeProps {
  status: DecisionStatus;
}

/** 전략 Decision 상태 배지. 단독 결론이 아니라 카드의 reason과 함께 쓴다. */
export function StatusBadge({ status }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}

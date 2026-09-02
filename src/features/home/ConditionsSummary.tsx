import Link from "next/link";
import { DEAL_TYPE_LABEL, maxBudgetFor } from "@/domain/price";
import type { UserConditions } from "@/domain/types";
import { formatKoreanMoney } from "@/lib/format";

export function ConditionsSummary({ conditions }: { conditions: UserConditions }) {
  return (
    <Link
      href="/conditions"
      className="bg-surface border-border block rounded-xl border p-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">우리 조건</h2>
        <span className="text-primary text-sm font-medium">수정</span>
      </div>
      <dl className="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <div>
          {DEAL_TYPE_LABEL[conditions.dealType]}{" "}
          <span className="text-foreground font-medium">
            {formatKoreanMoney(maxBudgetFor(conditions))}
          </span>
        </div>
        <div>
          통근{" "}
          <span className="text-foreground font-medium">
            {conditions.maxCommuteMinutes}분 이내
          </span>
        </div>
        <div>
          평형{" "}
          <span className="text-foreground font-medium">
            {conditions.desiredSize.min}~{conditions.desiredSize.max}평
          </span>
        </div>
      </dl>
    </Link>
  );
}

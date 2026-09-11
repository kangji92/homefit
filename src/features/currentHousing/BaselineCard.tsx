"use client";

import { useLivingContextStore } from "@/stores/livingContextStore";
import type { CurrentHousing } from "@/domain/types";

const TENURE_LABEL: Record<CurrentHousing["tenure"], string> = {
  owner: "자가", jeonse: "전세", monthly_rent: "월세", family: "가족 거주", other: "기타",
};

/**
 * "현재 유지" baseline. HousingStrategy로 생성하지 않고 CurrentHousing에서 파생하는
 * 비교 기준점(anchor)이다. **종합점수·status 없음.** 아래 전략 카드의
 * "옮겨서 얻는 것/포기하는 것"은 모두 이 baseline 대비 변화다. (current-housing.md §6, 결정 #3)
 */
export function BaselineCard() {
  const hasHydrated = useLivingContextStore((s) => s.hasHydrated);
  const current = useLivingContextStore((s) => s.current);
  if (!hasHydrated || !current) return null;

  const region = current.regionRef?.label;
  const summary = [region, TENURE_LABEL[current.tenure], current.homeName]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="border-border bg-surface-muted rounded-xl border border-dashed p-4">
      <div className="flex items-center gap-2">
        <span className="border-border text-muted-foreground rounded-full border bg-transparent px-2 py-0.5 text-xs font-medium">
          기준 · 현재 유지
        </span>
      </div>
      <h3 className="mt-1.5 text-base font-bold leading-snug">{summary || "현재 주거 유지"}</h3>
      <p className="text-muted-foreground mt-1 text-sm">
        아무 것도 바꾸지 않는 기준점이에요. 아래 전략의 <b>얻는 것/포기하는 것</b>은 이
        상태 대비 변화예요.
      </p>
      <ul className="mt-3 space-y-0.5">
        <li className="text-muted-foreground text-sm">· 추가 필요현금 없음</li>
        <li className="text-muted-foreground text-sm">· 통근 변화 없음</li>
        <li className="text-muted-foreground text-sm">· 신축·면적 개선 없음</li>
      </ul>
    </article>
  );
}

"use client";

import Link from "next/link";
import { useLivingContextStore } from "@/stores/livingContextStore";
import type { CurrentHousing } from "@/domain/types";

const TENURE_LABEL: Record<CurrentHousing["tenure"], string> = {
  owner: "자가", jeonse: "전세", monthly_rent: "월세", family: "가족 거주", other: "기타",
};

/** 현재 주거를 출발점으로 명시하는 배너. "현재 → 전략 → 목표" 서사의 '현재'. */
export function CurrentContextBanner() {
  const hasHydrated = useLivingContextStore((s) => s.hasHydrated);
  const current = useLivingContextStore((s) => s.current);
  if (!hasHydrated) return null;

  if (!current) {
    return (
      <Link
        href="/conditions"
        className="border-border text-muted-foreground block rounded-lg border border-dashed p-3 text-sm"
      >
        현재 어디서 어떻게 사는지 알려주면 <b className="text-foreground">옮기면 무엇이 달라지는지</b>{" "}
        보여드려요 →
      </Link>
    );
  }

  const region = current.regionRef?.label;
  return (
    <div className="bg-surface-muted flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
      <span className="text-muted-foreground text-xs">현재</span>
      <span className="font-medium">
        {region ? `${region} · ` : ""}
        {TENURE_LABEL[current.tenure]}
        {current.homeName ? ` · ${current.homeName}` : ""}
      </span>
      <span className="text-muted-foreground ml-auto text-xs">여기서 출발</span>
    </div>
  );
}

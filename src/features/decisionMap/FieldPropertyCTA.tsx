import Link from "next/link";
import { cn } from "@/lib/utils";

export interface FieldPropertyCTAProps {
  /** 부가 설명(맥락별로 다름). */
  description?: string;
  /** surface=일반(탐색), primary=강조(구역 상세). */
  variant?: "surface" | "primary";
}

/**
 * "현장에서 본 매물 분석하기" 진입 CTA — 현장 매물 분석 흐름(/strategy?view=map)으로 이동.
 * 탐색·구역 상세 등 여러 곳에서 동일하게 쓰이는 진입점.
 */
export function FieldPropertyCTA({
  description = "부동산에서 본 재개발 매물의 가격·권리 정보를 입력하면 신축 취득까지 예상 총투입액을 계산해요.",
  variant = "surface",
}: FieldPropertyCTAProps) {
  return (
    <Link
      href="/strategy?view=map"
      className={cn(
        "hover:border-primary flex items-center justify-between rounded-xl border p-3",
        variant === "primary" ? "border-primary/40 bg-primary/5" : "border-border bg-surface",
      )}
    >
      <span>
        <span className="text-sm font-semibold">현장에서 본 매물 분석하기</span>
        <span className="text-muted-foreground mt-0.5 block text-xs">{description}</span>
      </span>
      <span className="text-primary text-lg" aria-hidden>
        →
      </span>
    </Link>
  );
}

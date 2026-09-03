"use client";

import { Heart } from "lucide-react";
import type { ListingKind } from "@/domain/types";
import { cn } from "@/lib/utils";
import { useCandidatesStore } from "@/stores/candidatesStore";

/**
 * 목록 카드 위에 얹는 관심 담기 토글. 카드가 Link라 클릭이 이동으로
 * 번지지 않게 preventDefault/stopPropagation 한다.
 */
export function CandidateToggleButton({
  id,
  kind,
}: {
  id: string;
  kind: ListingKind;
}) {
  const candidates = useCandidatesStore((s) => s.candidates);
  const addCandidate = useCandidatesStore((s) => s.addCandidate);
  const removeCandidate = useCandidatesStore((s) => s.removeCandidate);
  const added = candidates.some((c) => c.id === id && c.kind === kind);

  return (
    <button
      type="button"
      aria-pressed={added}
      aria-label={added ? "관심에서 빼기" : "관심 담기"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (added) removeCandidate(id, kind);
        else addCandidate(id, kind);
      }}
      className={cn(
        "bg-surface/90 border-border grid size-8 place-items-center rounded-full border backdrop-blur",
        added ? "text-danger" : "text-muted-foreground",
      )}
    >
      <Heart className={cn("size-4", added && "fill-current")} aria-hidden />
    </button>
  );
}

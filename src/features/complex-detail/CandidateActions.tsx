import Link from "next/link";
import { useCandidatesStore } from "@/stores/candidatesStore";

export function CandidateActions({ complexId }: { complexId: string }) {
  const candidate = useCandidatesStore((s) =>
    s.candidates.find((c) => c.id === complexId),
  );
  const addCandidate = useCandidatesStore((s) => s.addCandidate);
  const removeCandidate = useCandidatesStore((s) => s.removeCandidate);
  const toggleFavorite = useCandidatesStore((s) => s.toggleFavorite);

  if (!candidate) {
    return (
      <button
        type="button"
        onClick={() => addCandidate(complexId)}
        className="bg-primary text-primary-foreground w-full rounded-md px-4 py-2.5 text-sm font-medium"
      >
        후보에 담기
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-sm">후보에 담긴 단지예요.</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => toggleFavorite(complexId)}
          aria-pressed={candidate.favorite}
          className="border-border flex-1 rounded-md border px-3 py-2 text-sm font-medium"
        >
          {candidate.favorite ? "★ 즐겨찾기" : "☆ 즐겨찾기"}
        </button>
        <Link
          href={`/compare?a=${complexId}`}
          className="border-border flex-1 rounded-md border px-3 py-2 text-center text-sm font-medium"
        >
          비교하기
        </Link>
      </div>
      <button
        type="button"
        onClick={() => removeCandidate(complexId)}
        className="text-danger w-full rounded-md px-3 py-2 text-sm font-medium"
      >
        후보에서 제거
      </button>
    </div>
  );
}

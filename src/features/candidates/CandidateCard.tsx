import Link from "next/link";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import type { DealType, FitResult, Home } from "@/domain/types";
import { formatActivePrice } from "@/lib/format";
import { useCandidatesStore } from "@/stores/candidatesStore";

export function CandidateCard({
  complex,
  fit,
  regionName,
  dealType,
}: {
  complex: Home;
  fit?: FitResult;
  regionName?: string;
  dealType: DealType;
}) {
  const favorite = useCandidatesStore(
    (s) =>
      s.candidates.find((c) => c.id === complex.id && c.kind === complex.kind)
        ?.favorite ?? false,
  );
  const toggleFavorite = useCandidatesStore((s) => s.toggleFavorite);

  return (
    <div className="bg-surface border-border flex items-center gap-3 rounded-xl border p-4">
      <Link
        href={`/complex/${complex.id}`}
        className="flex min-w-0 flex-1 items-center gap-4"
      >
        {fit && <ScoreGauge score={fit.totalScore} label="적합도" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{complex.name}</h3>
            {fit && !fit.passesDealbreakers && (
              <span className="bg-danger/10 text-danger shrink-0 rounded px-1.5 py-0.5 text-xs font-medium">
                조건 미충족
              </span>
            )}
          </div>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {regionName ? `${regionName} · ` : ""}
            {formatActivePrice(complex, dealType)}
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => toggleFavorite(complex.id, complex.kind)}
        aria-pressed={favorite}
        aria-label="즐겨찾기"
        className="text-fit-medium shrink-0 text-xl leading-none"
      >
        {favorite ? "★" : "☆"}
      </button>
    </div>
  );
}

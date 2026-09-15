import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { ListCardShell } from "@/components/ui/ListCardShell";
import { DealbreakerBadge } from "@/components/ui/DealbreakerBadge";
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
    <ListCardShell
      href={`/complex/${complex.id}`}
      action={
        <button
          type="button"
          onClick={() => toggleFavorite(complex.id, complex.kind)}
          aria-pressed={favorite}
          aria-label="즐겨찾기"
          className="text-fit-medium text-xl leading-none"
        >
          {favorite ? "★" : "☆"}
        </button>
      }
    >
      <div className="flex items-center gap-4">
        {fit && <ScoreGauge score={fit.totalScore} label="적합도" />}
        <div className="min-w-0 flex-1">
          <p className="text-primary text-xs font-semibold">검토 중인 후보</p>
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{complex.name}</h3>
            {complex.kind === "presale" && (
              <span className="bg-primary/10 text-primary shrink-0 rounded px-1.5 py-0.5 text-xs font-medium">
                분양
              </span>
            )}
            {fit && !fit.passesDealbreakers && <DealbreakerBadge />}
          </div>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {regionName ? `${regionName} · ` : ""}
            {formatActivePrice(complex, dealType)}
          </p>
          {fit && (
            <p className="text-muted-foreground mt-1 text-xs">
              우리 조건과 맞는 점을 확인해볼 후보예요.
            </p>
          )}
        </div>
      </div>
    </ListCardShell>
  );
}

import { ScoreGauge } from "@/components/ui/ScoreGauge";
import type { Complex, FitResult } from "@/domain/types";
import { formatKoreanMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Hero({
  complex,
  regionName,
  fit,
}: {
  complex: Complex;
  regionName?: string;
  fit: FitResult | null;
}) {
  return (
    <section className="bg-surface border-border rounded-xl border p-5 md:grid md:grid-cols-2 md:items-center md:gap-6">
      <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-3">
        {fit ? (
          <>
            <ScoreGauge score={fit.totalScore} size={96} label="적합도" />
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                fit.passesDealbreakers
                  ? "bg-surface-muted text-muted-foreground"
                  : "bg-danger/10 text-danger",
              )}
            >
              {fit.passesDealbreakers ? "절대조건 통과" : "조건 미충족"}
            </span>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            조건을 완성하면 적합도가 표시돼요.
          </p>
        )}
      </div>
      <div className="mt-4 md:mt-0">
        <h1 className="text-2xl font-bold">{complex.name}</h1>
        {regionName && (
          <p className="text-muted-foreground mt-1 text-sm">{regionName}</p>
        )}
        <p className="mt-3 text-lg font-semibold">
          {formatKoreanMoney(complex.price.representative)}
        </p>
        <p className="text-muted-foreground text-sm">
          {complex.sizesPyeong.join(", ")}평
        </p>
      </div>
    </section>
  );
}

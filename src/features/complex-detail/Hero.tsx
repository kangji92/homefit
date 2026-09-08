import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { DEAL_TYPE_LABEL } from "@/domain/price";
import type { DealType, FitResult, Home } from "@/domain/types";
import { formatActivePrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Hero({
  complex,
  regionName,
  fit,
  dealType,
}: {
  complex: Home;
  regionName?: string;
  fit: FitResult | null;
  dealType: DealType;
}) {
  const isPresale = complex.kind === "presale";
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
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{complex.name}</h1>
          {isPresale && (
            <span className="bg-primary/10 text-primary shrink-0 rounded-full px-2 py-0.5 text-xs font-medium">
              분양
            </span>
          )}
        </div>
        {regionName && (
          <p className="text-muted-foreground mt-1 text-sm">{regionName}</p>
        )}
        <p className="mt-3 text-lg font-semibold">
          <span className="text-muted-foreground mr-1 text-sm font-normal">
            {isPresale ? "분양가" : DEAL_TYPE_LABEL[dealType]}
          </span>
          {formatActivePrice(complex, dealType)}
        </p>
        <p className="text-muted-foreground text-sm">
          {complex.sizesPyeong.join(", ")}평
          {complex.kind === "presale" && ` · ${complex.moveInYear}년 입주 예정`}
        </p>
      </div>
    </section>
  );
}

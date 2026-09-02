import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { DEFAULT_SCORING_CONFIG } from "@/domain/scoring/config";
import {
  PRIORITY_KEYS,
  type Comparison,
  type Complex,
  type FitResult,
  type Winner,
  type Workplace,
} from "@/domain/types";
import { formatKoreanMoney } from "@/lib/format";
import { PRIORITY_LABELS } from "@/lib/priorityLabels";
import { DEALBREAKER_LABELS } from "@/lib/dealbreakerLabels";
import { cn } from "@/lib/utils";

interface Side {
  complex: Complex;
  fit: FitResult;
  regionName?: string;
}

function SideCard({
  side,
  data,
  overallWinner,
}: {
  side: "a" | "b";
  data: Side;
  overallWinner: Winner;
}) {
  const won = overallWinner === side;
  return (
    <div
      className={cn(
        "bg-surface rounded-xl border p-4 text-center",
        won ? "border-fit-high" : "border-border",
      )}
    >
      <div className="flex justify-center">
        <ScoreGauge score={data.fit.totalScore} label="적합도" />
      </div>
      <h3 className="mt-2 truncate font-semibold">{data.complex.name}</h3>
      {data.regionName && (
        <p className="text-muted-foreground truncate text-xs">
          {data.regionName}
        </p>
      )}
      {won && (
        <span className="bg-fit-high/10 text-fit-high mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium">
          종합 우세
        </span>
      )}
    </div>
  );
}

function CompareRow({
  a,
  label,
  b,
  winner,
}: {
  a: React.ReactNode;
  label: string;
  b: React.ReactNode;
  winner?: Winner;
}) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <div
        className={cn(
          "flex-1 text-left text-sm tabular-nums",
          winner === "a" ? "text-foreground font-bold" : "text-muted-foreground",
        )}
      >
        {a}
      </div>
      <div className="text-muted-foreground w-24 shrink-0 text-center text-xs">
        {label}
      </div>
      <div
        className={cn(
          "flex-1 text-right text-sm tabular-nums",
          winner === "b" ? "text-foreground font-bold" : "text-muted-foreground",
        )}
      >
        {b}
      </div>
    </div>
  );
}

function DealbreakerCell({ fit }: { fit: FitResult }) {
  if (fit.passesDealbreakers) {
    return (
      <div className="bg-fit-high/10 text-fit-high rounded-lg px-3 py-2 text-center text-sm font-medium">
        ✓ 모두 충족
      </div>
    );
  }
  return (
    <div className="bg-danger/10 rounded-lg px-3 py-2 text-sm">
      <p className="text-danger font-medium">✕ 조건 미충족</p>
      <ul className="text-danger/90 mt-1 space-y-0.5 text-xs">
        {fit.failedDealbreakers.map((k) => (
          <li key={k}>· {DEALBREAKER_LABELS[k]}</li>
        ))}
      </ul>
    </div>
  );
}

export function ComparisonView({
  a,
  b,
  comparison,
  workplaces,
}: {
  a: Side;
  b: Side;
  comparison: Comparison;
  workplaces: Workplace[];
}) {
  const cfg = DEFAULT_SCORING_CONFIG;
  const age = (c: Complex) => cfg.currentYear - c.completionYear;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <SideCard side="a" data={a} overallWinner={comparison.overallWinner} />
        <SideCard side="b" data={b} overallWinner={comparison.overallWinner} />
      </div>

      <section className="bg-surface border-border rounded-xl border p-4">
        <h2 className="mb-2 font-semibold">절대조건</h2>
        <div className="grid grid-cols-2 gap-3">
          <DealbreakerCell fit={a.fit} />
          <DealbreakerCell fit={b.fit} />
        </div>
      </section>

      <section className="bg-surface border-border rounded-xl border p-4">
        <h2 className="mb-2 font-semibold">항목별 적합도</h2>
        {PRIORITY_KEYS.map((k) => (
          <CompareRow
            key={k}
            a={a.fit.axisScores[k]}
            label={PRIORITY_LABELS[k]}
            b={b.fit.axisScores[k]}
            winner={comparison.perAxisWinner[k]}
          />
        ))}
        <p className="text-muted-foreground mt-2 text-xs">
          우세 판정은 정규화 점수 기준이에요.
        </p>
      </section>

      <section className="bg-surface border-border rounded-xl border p-4">
        <h2 className="mb-2 font-semibold">원시 정보</h2>
        <CompareRow
          a={formatKoreanMoney(a.complex.price.representative)}
          label="대표 가격"
          b={formatKoreanMoney(b.complex.price.representative)}
        />
        <CompareRow
          a={`${a.complex.sizesPyeong.join(", ")}평`}
          label="평형"
          b={`${b.complex.sizesPyeong.join(", ")}평`}
        />
        <CompareRow
          a={`${a.complex.households.toLocaleString("ko-KR")}세대`}
          label="세대수"
          b={`${b.complex.households.toLocaleString("ko-KR")}세대`}
        />
        <CompareRow
          a={`${a.complex.completionYear}년 (${age(a.complex)}년차)`}
          label="연식"
          b={`${b.complex.completionYear}년 (${age(b.complex)}년차)`}
        />
        <CompareRow
          a={`${a.complex.stationDistanceM.toLocaleString("ko-KR")}m`}
          label="역 거리"
          b={`${b.complex.stationDistanceM.toLocaleString("ko-KR")}m`}
        />
        {workplaces
          .filter((w) => w.id.length > 0)
          .map((w) => (
            <CompareRow
              key={w.id}
              a={
                a.complex.commuteMinutes[w.id] != null
                  ? `${a.complex.commuteMinutes[w.id]}분`
                  : "-"
              }
              label={`통근 · ${w.label || w.id}`}
              b={
                b.complex.commuteMinutes[w.id] != null
                  ? `${b.complex.commuteMinutes[w.id]}분`
                  : "-"
              }
            />
          ))}
      </section>

      {/* 향후 AI 설명 자리 (MVP는 계산 결과만) */}
      <p className="text-muted-foreground rounded-xl border border-dashed p-3 text-center text-xs">
        비교 결과에 대한 설명은 향후 제공될 예정이에요.
      </p>
    </div>
  );
}

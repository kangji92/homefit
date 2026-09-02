import { cn } from "@/lib/utils";

export interface ScoreGaugeProps {
  /** 0~100 적합도 점수 */
  score: number;
  size?: number;
  label?: string;
}

function bandColor(score: number): string {
  if (score >= 67) return "text-fit-high";
  if (score >= 34) return "text-fit-medium";
  return "text-fit-low";
}

/**
 * 적합도 점수 게이지 (색 강조는 적합도에 집중 — docs/standards/styling.md).
 * 원형 진행 링 + 중앙 점수.
 */
export function ScoreGauge({ score, size = 72, label }: ScoreGaugeProps) {
  const value = Math.max(0, Math.min(100, Math.round(score)));
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (value / 100) * circumference;

  return (
    <div
      role="img"
      aria-label={`적합도 ${value}점`}
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="text-surface-muted"
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={cn(bandColor(value))}
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          fill="none"
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-lg font-bold tabular-nums">{value}</span>
        {label && <span className="text-muted-foreground mt-0.5 text-[10px]">{label}</span>}
      </div>
    </div>
  );
}

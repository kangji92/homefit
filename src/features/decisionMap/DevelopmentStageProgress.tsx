import type { DevelopmentArea, DevelopmentMilestoneKind } from "@/domain/development";
import { cn } from "@/lib/utils";

/** 재개발/재건축 표준 진행 단계. 완료 판정은 공식 확정 milestone 기준(임의 추정 없음). */
const STEPS: { label: string; kind?: DevelopmentMilestoneKind }[] = [
  { label: "구역지정", kind: "designation" },
  { label: "조합설립", kind: "association" },
  { label: "사업시행", kind: "implementation" },
  { label: "관리처분", kind: "management" },
  { label: "착공", kind: "construction" },
  { label: "준공" }, // stage === "completed"
];

/**
 * 사업 진행 단계 stepper — 공식 확정 milestone이 있는 단계를 완료(✓)로 표시.
 * 점수/예측이 아니라 확정된 사실만 시각화(판단 보조).
 */
export function DevelopmentStageProgress({ area }: { area: DevelopmentArea }) {
  const confirmed = new Set(
    (area.milestones ?? []).filter((m) => m.status === "confirmed").map((m) => m.kind),
  );
  const done = STEPS.map((s) => (s.kind ? confirmed.has(s.kind) : area.stage === "completed"));
  const lastDone = done.lastIndexOf(true);

  return (
    <section className="bg-surface border-border rounded-xl border p-4" aria-label="사업 진행 단계">
      <p className="text-muted-foreground mb-3 text-xs font-semibold">사업 진행 단계</p>
      <ol className="flex items-start">
        {STEPS.map((s, i) => {
          const isDone = done[i];
          const isCurrent = i === lastDone;
          return (
            <li key={s.label} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                <span className={cn("h-0.5 flex-1", i === 0 ? "opacity-0" : done[i - 1] ? "bg-primary" : "bg-border")} />
                <span
                  className={cn(
                    "mx-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    isDone ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    isCurrent && "ring-primary/40 ring-2",
                  )}
                >
                  {isDone ? "✓" : i + 1}
                </span>
                <span className={cn("h-0.5 flex-1", i === STEPS.length - 1 ? "opacity-0" : done[i] ? "bg-primary" : "bg-border")} />
              </div>
              <span className={cn("mt-1 text-center text-[10px] leading-tight", isDone ? "text-foreground font-medium" : "text-muted-foreground")}>
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="text-muted-foreground mt-2 text-[11px]">확정 고시/인가 기준. 미확정 단계는 비활성.</p>
    </section>
  );
}

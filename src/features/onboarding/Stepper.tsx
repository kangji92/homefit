import { STEP_COUNT, STEP_TITLES } from "./schema";

export function Stepper({ current }: { current: number }) {
  const percent = ((current + 1) / STEP_COUNT) * 100;
  return (
    <div>
      <p className="text-muted-foreground text-sm">
        {current + 1} / {STEP_COUNT} 단계
      </p>
      <div className="bg-surface-muted mt-2 h-1.5 w-full overflow-hidden rounded-full">
        <div className="bg-primary h-full rounded-full" style={{ width: `${percent}%` }} />
      </div>
      <h1 className="mt-4 text-xl font-bold">{STEP_TITLES[current]}</h1>
    </div>
  );
}

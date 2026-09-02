import { PRIORITY_KEYS, type Priorities } from "@/domain/types";
import { PRIORITY_LABELS } from "@/lib/priorityLabels";
import { priorityLevel } from "@/lib/priorityLevel";

function equalPriorities(a: Priorities, b: Priorities): boolean {
  return PRIORITY_KEYS.every((k) => a[k] === b[k]);
}

/**
 * 우선순위 what-if 시뮬레이션 (docs/design/compare-simulation.md).
 * 저장 전까지 스토어에 영향을 주지 않는 로컬 실험 도구.
 */
export function SimulationPanel({
  value,
  saved,
  onChange,
  onReset,
  onSave,
  savedFlash,
}: {
  value: Priorities;
  saved: Priorities;
  onChange: (next: Priorities) => void;
  onReset: () => void;
  onSave: () => void;
  savedFlash: boolean;
}) {
  const dirty = !equalPriorities(value, saved);

  return (
    <details className="bg-surface border-border rounded-xl border p-4">
      <summary className="flex cursor-pointer items-center gap-2 font-semibold">
        우선순위 시뮬레이션
        {dirty && (
          <span className="bg-fit-medium/15 text-fit-medium rounded-full px-2 py-0.5 text-xs font-medium">
            변경됨
          </span>
        )}
      </summary>
      <p className="text-muted-foreground mt-1 text-xs">
        우선순위를 바꿔 두 후보의 결과가 어떻게 달라지는지 확인해요. 저장 전까지
        실제 조건에는 영향을 주지 않아요.
      </p>

      <div className="mt-3 space-y-3">
        {PRIORITY_KEYS.map((k) => (
          <div key={k}>
            <div className="flex items-baseline justify-between">
              <label htmlFor={`sim-${k}`} className="text-sm font-medium">
                {PRIORITY_LABELS[k]}
              </label>
              <span className="text-muted-foreground text-xs tabular-nums">
                {priorityLevel(value[k])} · {value[k]}
              </span>
            </div>
            <input
              id={`sim-${k}`}
              type="range"
              min={0}
              max={100}
              step={1}
              value={value[k]}
              aria-valuetext={`${priorityLevel(value[k])} ${value[k]}`}
              onChange={(e) => onChange({ ...value, [k]: Number(e.target.value) })}
              className="accent-primary mt-1 w-full"
            />
          </div>
        ))}
      </div>

      {savedFlash && !dirty && (
        <p role="status" className="text-success mt-3 text-sm font-medium">
          우선순위를 저장했어요.
        </p>
      )}

      {dirty && (
        <div className="mt-3 space-y-2">
          <p className="text-warning text-xs">
            저장하면 홈·상세·비교의 모든 점수에 반영돼요.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onReset}
              className="border-border flex-1 rounded-md border px-3 py-2 text-sm font-medium"
            >
              초기화
            </button>
            <button
              type="button"
              onClick={onSave}
              className="bg-primary text-primary-foreground flex-1 rounded-md px-3 py-2 text-sm font-medium"
            >
              이 우선순위로 저장
            </button>
          </div>
        </div>
      )}
    </details>
  );
}

import type { Dealbreakers } from "@/domain/types";
import { DEALBREAKER_LABELS } from "@/lib/dealbreakerLabels";

// failed = 위반(탈락), unknown = 미확정(주로 분양, 탈락 아님·경고).
export function DealbreakerAlert({
  failed,
  unknown = [],
}: {
  failed: (keyof Dealbreakers)[];
  unknown?: (keyof Dealbreakers)[];
}) {
  if (failed.length === 0 && unknown.length === 0) return null;

  return (
    <div className="space-y-2">
      {failed.length > 0 && (
        <div role="alert" className="bg-danger/10 rounded-xl p-4">
          <p className="text-danger font-medium">✕ 절대조건 미충족</p>
          <ul className="text-danger/90 mt-1 space-y-0.5 text-sm">
            {failed.map((k) => (
              <li key={k}>· {DEALBREAKER_LABELS[k]}</li>
            ))}
          </ul>
        </div>
      )}
      {unknown.length > 0 && (
        <div className="bg-warning/10 rounded-xl p-4">
          <p className="text-warning font-medium">⚠️ 아직 확정되지 않은 조건</p>
          <ul className="text-warning/90 mt-1 space-y-0.5 text-sm">
            {unknown.map((k) => (
              <li key={k}>· {DEALBREAKER_LABELS[k]} — 정보 확정 전이에요</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

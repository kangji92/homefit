import type { Dealbreakers } from "@/domain/types";
import { DEALBREAKER_LABELS } from "./dealbreakerLabels";

export function DealbreakerAlert({
  failed,
}: {
  failed: (keyof Dealbreakers)[];
}) {
  if (failed.length === 0) return null;
  return (
    <section
      role="alert"
      className="border-danger/30 bg-danger/10 rounded-xl border p-4"
    >
      <h2 className="text-danger font-semibold">절대조건 미충족</h2>
      <ul className="text-danger/90 mt-1 list-disc pl-5 text-sm">
        {failed.map((k) => (
          <li key={k}>{DEALBREAKER_LABELS[k]}</li>
        ))}
      </ul>
      <p className="text-danger/80 mt-2 text-xs">
        적합도 점수가 높아도 이 조건들을 충족하지 못했어요.
      </p>
    </section>
  );
}

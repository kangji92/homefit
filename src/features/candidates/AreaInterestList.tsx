import { computeAreaFit } from "@/domain/scoring";
import type { Area } from "@/domain/types";
import { AreaCard } from "@/features/area/AreaCard";
import { useCandidatesStore } from "@/stores/candidatesStore";
import { useConditionsStore } from "@/stores/conditionsStore";

export function AreaInterestList({ areas }: { areas: Area[] }) {
  const candidates = useCandidatesStore((s) => s.candidates);
  const removeCandidate = useCandidatesStore((s) => s.removeCandidate);
  const priorities = useConditionsStore((s) => s.priorities);

  const areaCandIds = new Set(
    candidates.filter((c) => c.kind === "area").map((c) => c.id),
  );
  const items = areas.filter((a) => areaCandIds.has(a.id));

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        관심 개발예정지가 없어요. 홈의 개발 예정지에서 담아보세요.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((area) => (
        <div key={area.id} className="space-y-1">
          <AreaCard area={area} fit={computeAreaFit(priorities, area)} />
          <button
            type="button"
            onClick={() => removeCandidate(area.id, "area")}
            className="text-muted-foreground w-full text-right text-xs"
          >
            관심 해제
          </button>
        </div>
      ))}
    </div>
  );
}

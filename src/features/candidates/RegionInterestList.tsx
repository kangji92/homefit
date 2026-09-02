import type { Region } from "@/domain/types";
import { useCandidatesStore } from "@/stores/candidatesStore";

export function RegionInterestList({ regions }: { regions: Region[] }) {
  const interests = useCandidatesStore((s) => s.regionInterests);
  const addRegionInterest = useCandidatesStore((s) => s.addRegionInterest);
  const removeRegionInterest = useCandidatesStore((s) => s.removeRegionInterest);
  const ids = new Set(interests.map((r) => r.regionId));

  if (regions.length === 0) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        지역 정보가 없어요.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {regions.map((r) => {
        const on = ids.has(r.id);
        return (
          <li
            key={r.id}
            className="bg-surface border-border flex items-center justify-between gap-3 rounded-xl border p-4"
          >
            <div className="min-w-0">
              <p className="font-medium">{r.name}</p>
              {r.summary && (
                <p className="text-muted-foreground truncate text-sm">
                  {r.summary}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => (on ? removeRegionInterest(r.id) : addRegionInterest(r.id))}
              aria-pressed={on}
              className="border-border shrink-0 rounded-md border px-3 py-1.5 text-sm font-medium"
            >
              {on ? "관심 해제" : "관심 등록"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

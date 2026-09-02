import type { Complex } from "@/domain/types";
import { formatKoreanMoney } from "@/lib/format";
import { useCandidatesStore } from "@/stores/candidatesStore";

export function DiscoverList({
  complexes,
  regionName,
}: {
  complexes: Complex[];
  regionName: Map<string, string>;
}) {
  const candidates = useCandidatesStore((s) => s.candidates);
  const addCandidate = useCandidatesStore((s) => s.addCandidate);
  const ids = new Set(candidates.map((c) => c.complexId));

  return (
    <ul className="divide-border divide-y">
      {complexes.map((c) => {
        const added = ids.has(c.id);
        return (
          <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <p className="text-muted-foreground text-xs">
                {regionName.get(c.regionId) ?? ""} ·{" "}
                {formatKoreanMoney(c.price.representative)}
              </p>
            </div>
            <button
              type="button"
              disabled={added}
              onClick={() => addCandidate(c.id)}
              className="border-border shrink-0 rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-40"
            >
              {added ? "담김" : "담기"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

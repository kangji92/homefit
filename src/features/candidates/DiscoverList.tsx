import type { DealType, Home } from "@/domain/types";
import { formatActivePrice } from "@/lib/format";
import { useCandidatesStore } from "@/stores/candidatesStore";

export function DiscoverList({
  complexes,
  regionName,
  dealType,
}: {
  complexes: Home[];
  regionName: Map<string, string>;
  dealType: DealType;
}) {
  const candidates = useCandidatesStore((s) => s.candidates);
  const addCandidate = useCandidatesStore((s) => s.addCandidate);
  const refs = new Set(candidates.map((c) => `${c.kind}:${c.id}`));

  return (
    <ul className="divide-border divide-y">
      {complexes.map((c) => {
        const added = refs.has(`${c.kind}:${c.id}`);
        return (
          <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <p className="text-muted-foreground text-xs">
                {regionName.get(c.regionId) ?? ""} ·{" "}
                {formatActivePrice(c, dealType)}
              </p>
            </div>
            <button
              type="button"
              disabled={added}
              onClick={() => addCandidate(c.id, c.kind)}
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

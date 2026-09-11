import type { Region } from "@/domain/types";
import { usePreferredRegions } from "@/features/currentHousing/usePreferredRegions";

export function RegionInterestList({ regions }: { regions: Region[] }) {
  // 권위 source = regionPrefs.preferred (regionInterests는 dual-write 호환).
  const { isPreferred, toggle } = usePreferredRegions();

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
        const on = isPreferred(r.id);
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
              onClick={() => toggle({ id: r.id, label: r.name })}
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

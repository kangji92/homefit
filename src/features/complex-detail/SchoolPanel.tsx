import { SCHOOL_BY_SIGUNGU } from "@/data/mock/schools";
import { sigunguForRegion } from "@/lib/regionSigungu";

const LEVELS = [
  { key: "elementary", label: "초등학교" },
  { key: "middle", label: "중학교" },
  { key: "high", label: "고등학교" },
] as const;

/** 단지 시군구의 초·중·고 현황(공공데이터). 학군 지도 대체 정보 패널. */
export function SchoolPanel({ regionId }: { regionId: string }) {
  const sigungu = sigunguForRegion(regionId);
  const schools = sigungu ? SCHOOL_BY_SIGUNGU[sigungu] : undefined;
  if (!sigungu || !schools) return null;

  return (
    <section className="bg-surface border-border rounded-xl border p-4">
      <div className="flex items-center gap-1.5">
        <span aria-hidden>🎒</span>
        <h2 className="text-sm font-semibold">학군 · {sigungu} 학교 현황</h2>
      </div>

      <ul className="mt-3 grid grid-cols-3 gap-2">
        {LEVELS.map(({ key, label }) => (
          <li
            key={key}
            className="bg-surface-muted rounded-lg p-2 text-center"
          >
            <p className="text-lg font-bold tabular-nums">{schools[key]}</p>
            <p className="text-muted-foreground text-xs">{label}</p>
          </li>
        ))}
      </ul>

      {LEVELS.map(({ key, label }) =>
        schools.names[key].length ? (
          <p key={key} className="text-muted-foreground mt-2 text-xs">
            <span className="text-foreground font-medium">{label}</span>{" "}
            {schools.names[key].slice(0, 5).join(" · ")}
            {schools[key] > 5 ? " 등" : ""}
          </p>
        ) : null,
      )}

      <p className="text-muted-foreground mt-3 text-xs">
        공공데이터(전국 학교 위치 표준데이터) 기준 · {sigungu} 전체 집계예요. 실제
        배정 학교·학군은 주소·학구도로 확인하세요.
      </p>
    </section>
  );
}

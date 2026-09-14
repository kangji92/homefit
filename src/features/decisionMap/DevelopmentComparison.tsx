import type { DevelopmentArea, RedevelopmentStage } from "@/domain/development";
import { developmentSummary } from "@/domain/development";

export interface DevelopmentComparisonProps {
  areas: DevelopmentArea[];
}

const PHASE_LABEL: Record<RedevelopmentStage, string> = {
  designation: "구역지정", association: "조합설립 이후", implementation: "사업시행인가",
  management: "관리처분", demolition: "이주·철거", construction: "착공",
};
const n = (v?: number, unit = "") => (v != null ? `${v.toLocaleString("ko-KR")}${unit}` : "—");

/**
 * 여러 개발사업(동측/북측 등)을 **동일 layout으로 나란히** 비교. 진행정보 비교일 뿐,
 * 투자점수/순위로 변환하지 않는다. (docs/design 개발레이어 real-pilot 비교 UI)
 */
export function DevelopmentComparison({ areas }: DevelopmentComparisonProps) {
  if (areas.length < 2) return null;
  const cols = areas.map(developmentSummary);
  const rows: { label: string; get: (c: (typeof cols)[number]) => string }[] = [
    { label: "현재 단계", get: (c) => (c.currentPhase ? PHASE_LABEL[c.currentPhase] : "—") },
    { label: "총 세대수", get: (c) => n(c.totalUnits) },
    { label: "조합원", get: (c) => n(c.memberCount, "인") },
    { label: "분양", get: (c) => n(c.saleUnits) },
    { label: "임대", get: (c) => n(c.rentalUnits) },
    { label: "최고층", get: (c) => n(c.maxFloor, "층") },
    { label: "다음 목표", get: (c) => (c.nextTarget ? `${c.nextTarget.date ?? ""} ${c.nextTarget.label}`.trim() : "—") },
  ];

  return (
    <section className="bg-surface border-border rounded-xl border p-4" aria-label="개발사업 비교">
      <h3 className="text-sm font-bold">사업 진행 비교</h3>
      <p className="text-muted-foreground mb-2 text-[11px]">진행정보 비교예요 — 투자점수·순위가 아니에요.</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px] text-sm">
          <thead>
            <tr>
              <th className="text-muted-foreground py-1 text-left text-xs font-medium">항목</th>
              {cols.map((c) => (
                <th key={c.areaId} className="py-1 text-right text-xs font-semibold">{c.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-border border-t">
                <td className="text-muted-foreground py-1 text-xs">{r.label}</td>
                {cols.map((c) => (
                  <td key={c.areaId} className="py-1 text-right font-medium">{r.get(c)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

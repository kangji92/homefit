import type {
  ComparablePlanField,
  DataSourceType,
  DevelopmentArea,
  DevelopmentMilestone,
  DevelopmentMilestoneKind,
  DevelopmentPlanType,
  DevelopmentType,
  DevelopmentVerification,
  PlanFieldValue,
} from "@/domain/development";
import { planFieldComparison, planFieldsDiffer } from "@/domain/development";
import { cn } from "@/lib/utils";

export interface DevelopmentDetailPanelProps {
  area: DevelopmentArea;
}

const TYPE_LABEL: Record<DevelopmentType, string> = {
  redevelopment: "재개발", reconstruction: "재건축", railway: "철도", new_town: "신도시", other: "개발",
};
const PLANTYPE_LABEL: Record<DevelopmentPlanType, string> = {
  official: "공식 사업계획", contractor_proposal: "시공사 제안", implementation: "사업시행", management: "관리처분", other: "기타",
};
const SOURCE_LABEL: Record<DataSourceType, string> = {
  official: "공식", association: "조합", contractor: "시공사", media: "보도", broker: "중개", user_input: "사용자", mock: "mock", estimated: "추정",
};
const VERIF_LABEL: Record<DevelopmentVerification, string> = { verified: "공식 확인", reported: "보도/2차", unverified: "미검증" };
const VERIF_CLS: Record<DevelopmentVerification, string> = {
  verified: "bg-success/10 text-success", reported: "bg-warning/10 text-warning", unverified: "bg-muted text-muted-foreground",
};
const MILESTONE_LABEL: Record<DevelopmentMilestoneKind, string> = {
  designation: "정비구역 지정", association: "조합설립인가", implementation: "사업시행인가", management: "관리처분인가", construction: "착공", move_in: "입주", other: "기타 절차",
};
const MILESTONE_STATUS: Record<"confirmed" | "planned" | "target", { label: string; cls: string }> = {
  confirmed: { label: "확정", cls: "bg-success/10 text-success" },
  target: { label: "목표", cls: "bg-primary/10 text-primary" },
  planned: { label: "예정", cls: "bg-muted text-muted-foreground" },
};
const FIELDS: { label: string; field: ComparablePlanField }[] = [
  { label: "총 세대수", field: "totalUnits" },
  { label: "분양", field: "saleUnits" }, // 분양세대(중립)
  { label: "일반분양", field: "generalSaleUnits" }, // 순수 일반분양(공식 근거 있을 때만)
  { label: "임대", field: "rentalUnits" },
  { label: "동수", field: "buildingCount" },
  { label: "최고층", field: "maxFloor" },
  { label: "시공사", field: "contractor" },
  { label: "브랜드", field: "brand" },
  { label: "(가칭)단지명", field: "proposedComplexName" },
];
const FACTS: { label: string; key: keyof NonNullable<DevelopmentArea["facts"]>; unit?: string }[] = [
  { label: "구역면적", key: "siteAreaM2", unit: "㎡" },
  { label: "조합원", key: "memberCount", unit: "인" },
  { label: "필지수", key: "landParcelCount" },
  { label: "기존 건물", key: "existingBuildingCount", unit: "동" },
  { label: "기존 세대", key: "existingHouseholds" },
  { label: "주차대수", key: "parkingSpaces", unit: "대" },
  { label: "건폐율", key: "buildingCoverageRatio", unit: "%" },
  { label: "용적률", key: "floorAreaRatio", unit: "%" },
  { label: "지하", key: "basementFloors", unit: "층" },
];

function VerifBadge({ v }: { v?: DevelopmentVerification }) {
  if (!v) return null;
  return <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", VERIF_CLS[v])}>{VERIF_LABEL[v]}</span>;
}

/**
 * 개발사업 상세. **Area-level 검증은 project identity만** — 세대수/시공사 등 세부는 각
 * 계획안(plan) 기준으로 표시하고, 출처가 다르면 **하나로 합치지 않고 나란히** 보여준다.
 * (docs/design 개발레이어 real-pilot §3,§4,§7)
 */
export function DevelopmentDetailPanel({ area }: DevelopmentDetailPanelProps) {
  const plans = area.plans ?? [];
  const rows = FIELDS.map((f) => ({ ...f, values: planFieldComparison(plans, f.field) })).filter((r) => r.values.length > 0);

  return (
    <section className="bg-surface border-border rounded-xl border p-4" aria-label="개발사업 상세">
      <div className="flex items-center gap-2">
        <span className="bg-surface-muted text-muted-foreground rounded px-1.5 py-0.5 text-[11px] font-medium">
          {TYPE_LABEL[area.developmentType]}
        </span>
        <VerifBadge v={area.verification} />
      </div>
      <h3 className="mt-1 text-base font-bold">{area.name}</h3>
      {area.verification && (
        <p className="text-muted-foreground mt-0.5 text-[11px]">
          ※ 위 검증은 <b>사업 존재·구역/사업명</b> 기준이에요. 세부 수치는 각 계획안 출처를 확인하세요.
        </p>
      )}

      {/* 주요 일정 (확정/예정 구분) */}
      {area.milestones && area.milestones.length > 0 && (
        <div className="mt-3">
          <p className="text-muted-foreground mb-1 text-xs font-semibold">사업 주요 일정</p>
          <ul className="space-y-0.5">
            {area.milestones.map((m: DevelopmentMilestone, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate">{m.label ?? MILESTONE_LABEL[m.kind]}</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span className="font-medium">{m.date ?? "미정"}</span>
                  <span className={cn("rounded px-1 py-0.5 text-[10px]", MILESTONE_STATUS[m.status].cls)}>
                    {MILESTONE_STATUS[m.status].label}
                  </span>
                  <VerifBadge v={m.verification} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 계획안별 값(충돌 시 나란히) */}
      {rows.length > 0 ? (
        <dl className="border-border mt-3 divide-y rounded-lg border">
          {rows.map((r) => (
            <div key={r.field} className="px-3 py-2">
              <dt className="text-muted-foreground text-xs">{r.label}</dt>
              <dd className="mt-0.5">
                {planFieldsDiffer(r.values) ? (
                  <ul className="space-y-0.5">
                    {r.values.map((v) => (
                      <li key={v.planId} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground text-xs">{PLANTYPE_LABEL[v.planType]}</span>
                        <FieldValue v={v} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <FieldValue v={r.values[0]} />
                )}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-muted-foreground mt-3 text-sm">공개된 세부 계획 수치가 아직 없어요.</p>
      )}

      {/* 사업 현황·물리 facts */}
      {area.facts && Object.values(area.facts).some((v) => v != null) && (
        <div className="mt-3">
          <p className="text-muted-foreground mb-1 text-xs font-semibold">사업 현황</p>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-sm">
            {FACTS.filter((f) => area.facts![f.key] != null).map((f) => (
              <div key={f.key} className="flex items-baseline justify-between">
                <dt className="text-muted-foreground text-xs">{f.label}</dt>
                <dd className="font-medium">
                  {area.facts![f.key]!.toLocaleString("ko-KR")}
                  {f.unit ?? ""}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {area.geometryAccuracy && (
        <p className="text-muted-foreground mt-2 text-[11px]">
          경계 정확도: {area.geometryAccuracy === "official_boundary" ? "공식 경계" : area.geometryAccuracy === "traced_from_official_map" ? "공식도면 수기(근사)" : area.geometryAccuracy === "approximate" ? "근사" : "대표점만(경계 미확보)"}
        </p>
      )}
    </section>
  );
}

function FieldValue({ v }: { v: PlanFieldValue }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="font-medium">{typeof v.value === "number" ? v.value.toLocaleString("ko-KR") : v.value}</span>
      <span className="bg-surface-muted text-muted-foreground rounded px-1 py-0.5 text-[10px]">{SOURCE_LABEL[v.sourceType]}</span>
      <VerifBadge v={v.verification} />
    </span>
  );
}

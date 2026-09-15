import { ListCardShell } from "@/components/ui/ListCardShell";
import type {
  DevelopmentArea,
  DevelopmentStage,
  DevelopmentType,
  RedevelopmentStage,
} from "@/domain/development";

export interface DevelopmentAreaCardProps {
  area: DevelopmentArea;
  /** 링크 목적지(기본 Decision Map). */
  href?: string;
}

const TYPE_LABEL: Record<DevelopmentType, string> = {
  redevelopment: "재개발", reconstruction: "재건축", railway: "철도", new_town: "신도시", other: "개발",
};
const STAGE_LABEL: Record<DevelopmentStage, string> = {
  proposed: "제안", planned: "계획", approved: "승인", in_progress: "진행 중", completed: "완료",
};
const DETAIL_LABEL: Record<RedevelopmentStage, string> = {
  designation: "구역지정", association: "조합설립", implementation: "사업시행인가",
  management: "관리처분", demolition: "이주·철거", construction: "착공",
};

/**
 * 정비사업 구역(DevelopmentArea)을 **판단 보조 정보 카드**로 표시. AreaFit(개발 예정지)과
 * 달리 점수/순위가 없다 — fitScore 미반영. 클릭 시 전용 상세(/development/[id])로 이동.
 */
export function DevelopmentAreaCard({ area, href }: DevelopmentAreaCardProps) {
  const to = href ?? `/development/${area.id}`;
  const stage = area.detailStage ? DETAIL_LABEL[area.detailStage] : STAGE_LABEL[area.stage];
  // 확정된 최신 사업단계 milestone(구역 내부·매물 provenance와 무관, 사업 자체의 공식 단계).
  const confirmed = (area.milestones ?? []).filter((m) => m.status === "confirmed");
  const latest = confirmed[confirmed.length - 1];
  const plan = area.plans?.find((p) => p.type === "official") ?? area.plans?.[0];

  return (
    <ListCardShell href={to} className="hover:border-primary">
      <div className="flex items-center gap-2">
        <span className="bg-warning/10 text-warning rounded-full px-2 py-0.5 text-[11px] font-semibold">
          {TYPE_LABEL[area.developmentType]}
        </span>
        <span className="text-muted-foreground text-xs">
          {stage}
          {area.certainty !== "confirmed" && ` · ${area.certainty === "likely" ? "가능성" : "장기검토"}`}
        </span>
      </div>
      <h3 className="mt-1 text-base font-bold">{area.name}</h3>
      <dl className="text-muted-foreground mt-1.5 space-y-0.5 text-xs">
        {latest?.label && (
          <div>최근 확정: {latest.label}{latest.date ? ` (${latest.date})` : ""}</div>
        )}
        {plan?.totalUnits != null && (
          <div>계획 세대수: {plan.totalUnits.toLocaleString("ko-KR")}세대</div>
        )}
      </dl>
      <p className="text-muted-foreground mt-2 text-[11px]">
        판단 보조 정보 · 적합도 점수에 반영되지 않아요. 자세히 보기 →
      </p>
    </ListCardShell>
  );
}

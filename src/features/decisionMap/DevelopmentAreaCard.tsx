import { ListCardShell } from "@/components/ui/ListCardShell";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
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
  /** 지역 적합도(위치·교통·학군 기준). 있으면 게이지 표시. 개발 성과 점수가 아님. */
  localFit?: number;
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
 * 정비사업 구역(DevelopmentArea) 카드. **지역 적합도(위치·교통·학군)**만 점수로 표시할 수 있고,
 * 세대·분양가 등 **개발 성과는 점수에 넣지 않는다**(정보만). 클릭 시 전용 상세(/development/[id]).
 */
export function DevelopmentAreaCard({ area, href, localFit }: DevelopmentAreaCardProps) {
  const to = href ?? `/development/${area.id}`;
  const stage = area.detailStage ? DETAIL_LABEL[area.detailStage] : STAGE_LABEL[area.stage];
  const confirmed = (area.milestones ?? []).filter((m) => m.status === "confirmed");
  const latest = confirmed[confirmed.length - 1];
  const plan = area.plans?.find((p) => p.type === "official") ?? area.plans?.[0];

  return (
    <ListCardShell href={to} className="hover:border-primary">
      <div className="flex items-start gap-3">
        {localFit != null && <ScoreGauge score={localFit} size={56} label="지역" />}
        <div className="min-w-0 flex-1">
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
            {localFit != null
              ? "지역 적합도 = 위치·교통·학군 기준(개발 성과 아님). 자세히 보기 →"
              : "판단 보조 정보 · 적합도 점수 없음. 자세히 보기 →"}
          </p>
        </div>
      </div>
    </ListCardShell>
  );
}

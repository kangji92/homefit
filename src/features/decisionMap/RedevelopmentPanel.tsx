import type { Home, OccupancyRightStatus } from "@/domain/types";
import type {
  DevelopmentArea,
  DevelopmentStage,
  DevelopmentType,
  RedevelopmentStage,
} from "@/domain/development";
import { redevelopmentListingSummary } from "@/domain/development";
import { formatKoreanMoney } from "@/lib/format";

export interface RedevelopmentPanelProps {
  home: Home;
  area?: DevelopmentArea;
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
const OCCUPANCY_LABEL: Record<OccupancyRightStatus, string> = {
  unknown: "확인 필요", expected: "예상", confirmed: "확보", excluded: "제외",
};

/**
 * 재개발 구역 내부 매물을 "빌라 9억"이 아니라 **실거주 주택 + 정비사업 투자대상**으로
 * 표현. 계산값(프리미엄)은 selector가 산출, 미상은 "정보 없음/확인 필요"로 명시.
 * fitScore/decisionStatus는 건드리지 않는다(판단 보조). (docs/design 개발레이어 §4)
 */
export function RedevelopmentPanel({ home, area }: RedevelopmentPanelProps) {
  const s = redevelopmentListingSummary(home, area);
  if (!s) return null;

  const money = (m?: { manwon: number }) => (m ? formatKoreanMoney(m.manwon) : "정보 없음");
  const stageText = area
    ? area.detailStage
      ? DETAIL_LABEL[area.detailStage]
      : STAGE_LABEL[area.stage]
    : undefined;

  return (
    <section className="bg-surface border-border rounded-xl border p-4" aria-label="정비사업 매물 요약">
      <div className="flex items-center gap-2">
        <span className="bg-warning/10 text-warning rounded-full px-2 py-0.5 text-xs font-semibold">
          실거주 + 정비사업 투자대상
        </span>
      </div>
      <h3 className="mt-1.5 text-base font-bold">{home.name}</h3>

      <dl className="border-border mt-3 divide-y rounded-lg border text-sm">
        <Row label="매물가(호가)" value={money(s.askingPrice)} />
        <Row label="최근 실거래" value={money(s.recentTransactionPrice)} />
        <Row
          label="실거래 대비 호가"
          value={
            s.premium
              ? `+${formatKoreanMoney(s.premium.amount.manwon)} (+${(s.premium.ratio * 100).toFixed(0)}%)`
              : "정보 없음"
          }
          hint={s.premium ? "호가 프리미엄(계산값)" : undefined}
        />
        {area && (
          <Row
            label="정비사업"
            value={`${area.name}${s.inside ? " 구역 내부" : ""}`}
            hint={`${TYPE_LABEL[area.developmentType]} · ${stageText ?? ""}${
              area.certainty !== "confirmed" ? ` · ${area.certainty === "likely" ? "가능성" : "장기검토"}` : ""
            }`}
          />
        )}
        <Row label="대지지분" value={s.landShareM2 != null ? `${s.landShareM2}㎡` : "정보 없음"} />
        <Row label="예상 추가분담금" value={money(s.estimatedContribution)} hint="임의 추정 안 함" />
        <Row label="입주권" value={OCCUPANCY_LABEL[s.occupancyRightStatus]} />
      </dl>

      <p className="text-muted-foreground mt-2 text-[11px]">
        ※ 개발정보는 <b>판단 보조</b>용이며 적합도 점수에 반영되지 않아요. 값은 mock/미확인일 수 있어요.
      </p>
    </section>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between px-3 py-2">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-right font-medium">
        {value}
        {hint && <span className="text-muted-foreground block text-[11px] font-normal">{hint}</span>}
      </dd>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { useDevelopment } from "@/hooks/queries";
import { formatKoreanMoney } from "@/lib/format";
import {
  DecisionMap,
  DevelopmentDetailPanel,
  DevelopmentStageProgress,
  buildDecisionMapScene,
  FieldPropertyCTA,
} from "@/features/decisionMap";
import type {
  DevelopmentArea,
  DevelopmentCertainty,
  DevelopmentStage,
  DevelopmentType,
  MemberSaleEstimate,
  RedevelopmentStage,
} from "@/domain/development";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<DevelopmentType, string> = {
  redevelopment: "재개발", reconstruction: "재건축", railway: "철도", new_town: "신도시", other: "개발",
};
const STAGE_LABEL: Record<DevelopmentStage, string> = {
  proposed: "제안", planned: "예정", approved: "승인", in_progress: "진행 중", completed: "준공",
};
const DETAIL_LABEL: Record<RedevelopmentStage, string> = {
  designation: "구역지정", association: "조합설립", implementation: "사업시행인가",
  management: "관리처분", demolition: "이주·철거", construction: "착공",
};
const CERTAINTY: Record<DevelopmentCertainty, { label: string; cls: string } | null> = {
  confirmed: null, // 확정은 칩 생략(기본)
  likely: { label: "가능성", cls: "bg-warning/10 text-warning" },
  uncertain: { label: "장기검토", cls: "bg-muted text-muted-foreground" },
};

const rangeText = (e: MemberSaleEstimate) =>
  e.price
    ? e.price.min.manwon === e.price.max.manwon
      ? formatKoreanMoney(e.price.min.manwon)
      : `${formatKoreanMoney(e.price.min.manwon)} ~ ${formatKoreanMoney(e.price.max.manwon)}`
    : "예정가 미확보";
const verifTag = (v?: MemberSaleEstimate["verification"]) =>
  v === "verified" ? "공식 확인" : v === "reported" ? "보도/2차" : "미검증";

function stageText(area: DevelopmentArea): string {
  return area.detailStage ? DETAIL_LABEL[area.detailStage] : STAGE_LABEL[area.stage];
}
function boundaryCaption(area: DevelopmentArea): string {
  switch (area.geometryAccuracy) {
    case "official_boundary": return "공식 경계 (NSDI 정비구역)";
    case "traced_from_official_map": return "공식도면 수기(근사) 경계";
    case "approximate": return "근사 경계";
    default: return "대표 위치만 · 공식 경계 미확보 (지도는 주변 위치)";
  }
}

/** 정비사업 구역 전용 상세 — 헤더 + 진행단계 + 경계 지도 + 전체 상세(판단 보조·비점수). */
export function DevelopmentFeature({ id }: { id: string }) {
  const { data: area, isLoading } = useDevelopment(id);

  const scene = useMemo(
    () => (area ? buildDecisionMapScene({ workplaces: [], developments: [area], selectedDevelopmentId: area.id }) : undefined),
    [area],
  );

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center text-sm">
        불러오는 중…
      </div>
    );
  }
  if (!area || !scene) {
    return (
      <PageContainer className="max-w-2xl">
        <p className="text-muted-foreground py-16 text-center text-sm">정비사업 구역을 찾을 수 없어요.</p>
        <Link href="/explore" className="text-primary block text-center text-sm font-medium">탐색으로 돌아가기</Link>
      </PageContainer>
    );
  }

  const estimates = area.memberSaleEstimates ?? [];
  const certainty = CERTAINTY[area.certainty];

  return (
    <PageContainer className="max-w-2xl space-y-4">
      <Link href="/explore" className="text-muted-foreground text-xs">← 탐색</Link>

      {/* 헤더 — 이름 + 유형·단계·확정성 */}
      <header className="space-y-1.5">
        <h1 className="text-xl font-bold leading-tight">{area.name}</h1>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-semibold">
            {TYPE_LABEL[area.developmentType]}
          </span>
          <span className="bg-surface-muted text-foreground rounded-full px-2 py-0.5 text-xs font-medium">
            {stageText(area)}
          </span>
          {certainty && (
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", certainty.cls)}>
              {certainty.label}
            </span>
          )}
        </div>
        {area.summary && <p className="text-muted-foreground text-sm">{area.summary}</p>}
      </header>

      {/* 사업 진행 단계 stepper */}
      <DevelopmentStageProgress area={area} />

      {/* 경계 지도 + 정확도 캡션 */}
      <div className="space-y-1">
        <DecisionMap
          scene={scene}
          className="border-border h-[40vh] overflow-hidden rounded-xl border"
        />
        <p className="text-muted-foreground px-1 text-[11px]">{boundaryCaption(area)}</p>
      </div>

      {/* 전체 상세 — 헤더는 위에서 보여줬으므로 생략 */}
      <DevelopmentDetailPanel area={area} hideHeader />

      {/* 평형별 예정 조합원분양가 */}
      {estimates.length > 0 && (
        <section className="bg-surface border-border rounded-xl border p-4" aria-label="평형별 예정 조합원분양가">
          <h2 className="text-base font-bold">평형별 예정 조합원분양가</h2>
          <p className="text-muted-foreground mt-0.5 text-[11px]">공식 확정 분양가가 아니에요. 근거 있는 평형만 금액을 표기해요.</p>
          <ul className="border-border mt-3 divide-y rounded-lg border">
            {estimates.map((e) => (
              <li key={e.id} className="flex items-baseline justify-between px-3 py-2 text-sm">
                <span className="font-medium">{e.sizeLabel}</span>
                <span className="text-right">
                  {rangeText(e)}
                  <span className="text-muted-foreground block text-[11px]">{e.sourceLabel ?? "현장 자료"} · {verifTag(e.verification)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 현장 매물 분석 진입 */}
      <FieldPropertyCTA variant="primary" description="이 구역의 실제 매물을 입력해 신축 취득까지 총투입액을 계산해요." />

      <p className="text-muted-foreground text-[11px]">
        정비사업 정보는 판단 보조용이며 적합도 점수에 반영되지 않아요. 값의 출처·검증상태는 위에 표기돼 있어요.
      </p>
    </PageContainer>
  );
}

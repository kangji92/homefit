"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { useDevelopment } from "@/hooks/queries";
import { formatKoreanMoney } from "@/lib/format";
import { DecisionMap } from "@/features/decisionMap";
import { DevelopmentDetailPanel } from "@/features/decisionMap";
import { buildDecisionMapScene } from "@/features/decisionMap";
import type { MemberSaleEstimate } from "@/domain/development";

const rangeText = (e: MemberSaleEstimate) =>
  e.price
    ? e.price.min.manwon === e.price.max.manwon
      ? formatKoreanMoney(e.price.min.manwon)
      : `${formatKoreanMoney(e.price.min.manwon)} ~ ${formatKoreanMoney(e.price.max.manwon)}`
    : "예정가 미확보";
const verifTag = (v?: MemberSaleEstimate["verification"]) =>
  v === "verified" ? "공식 확인" : v === "reported" ? "보도/2차" : "미검증";

/** 정비사업 구역 전용 상세 — 그 구역만 집중한 경계 지도 + 전체 상세(판단 보조·비점수). */
export function DevelopmentFeature({ id }: { id: string }) {
  const { data: area, isLoading } = useDevelopment(id);

  // 이 구역만 담은 focused scene(경계 폴리곤 + fitBounds 대상).
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

  return (
    <PageContainer className="max-w-2xl space-y-4">
      <Link href="/explore" className="text-muted-foreground text-xs">← 탐색</Link>

      {/* 구역 경계 지도(공식 폴리곤) — 이 구역만 fitBounds */}
      <DecisionMap
        scene={scene}
        className="border-border h-[40vh] overflow-hidden rounded-xl border"
      />

      {/* 전체 상세 — identity·검증·milestones·계획안 비교·facts·경계정확도 */}
      <DevelopmentDetailPanel area={area} />

      {/* 평형별 예정 조합원분양가 */}
      {estimates.length > 0 && (
        <section className="bg-surface border-border rounded-xl border p-4" aria-label="평형별 예정 조합원분양가">
          <h3 className="text-base font-bold">평형별 예정 조합원분양가</h3>
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
      <Link
        href="/strategy?view=map"
        className="border-primary/40 bg-primary/5 hover:border-primary flex items-center justify-between rounded-xl border p-3"
      >
        <span>
          <span className="text-sm font-semibold">현장에서 본 매물 분석하기</span>
          <span className="text-muted-foreground mt-0.5 block text-xs">이 구역의 실제 매물을 입력해 신축 취득까지 총투입액을 계산해요.</span>
        </span>
        <span className="text-primary text-lg" aria-hidden>→</span>
      </Link>

      <p className="text-muted-foreground text-[11px]">
        정비사업 정보는 판단 보조용이며 적합도 점수에 반영되지 않아요. 값의 출처·검증상태는 위에 표기돼 있어요.
      </p>
    </PageContainer>
  );
}

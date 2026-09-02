"use client";

import Link from "next/link";
import { ScoreGauge } from "@/components/ui/ScoreGauge";
import { PageContainer } from "@/components/layout/PageContainer";
import { computeAreaFit } from "@/domain/scoring";
import type { AreaMetrics } from "@/domain/types";
import { useArea } from "@/hooks/queries";
import { useCandidatesStore } from "@/stores/candidatesStore";
import { useConditionsStore } from "@/stores/conditionsStore";

const METRIC_LABELS: { key: keyof AreaMetrics; label: string }[] = [
  { key: "plannedInfra", label: "계획 인프라" },
  { key: "transitPlan", label: "교통계획" },
  { key: "supply", label: "공급 규모" },
  { key: "futurePotential", label: "미래가치" },
  { key: "environment", label: "주거환경" },
];

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center px-4 text-sm">
      {children}
    </div>
  );
}

export function AreaFeature({ id }: { id: string }) {
  const areaQuery = useArea(id);
  const condHydrated = useConditionsStore((s) => s.hasHydrated);
  const candHydrated = useCandidatesStore((s) => s.hasHydrated);
  const priorities = useConditionsStore((s) => s.priorities);

  const candidate = useCandidatesStore((s) =>
    s.candidates.find((c) => c.id === id && c.kind === "area"),
  );
  const addCandidate = useCandidatesStore((s) => s.addCandidate);
  const removeCandidate = useCandidatesStore((s) => s.removeCandidate);

  if (!condHydrated || !candHydrated) return <Center>불러오는 중…</Center>;
  if (areaQuery.isLoading) return <Center>불러오는 중…</Center>;

  const area = areaQuery.data;
  if (!area) return <Center>개발 예정지를 찾을 수 없어요.</Center>;

  const fit = computeAreaFit(priorities, area);

  return (
    <PageContainer className="max-w-2xl space-y-4">
      <section className="bg-surface border-border rounded-xl border p-5 md:flex md:items-center md:gap-6">
        <div className="flex items-center gap-4 md:flex-col md:items-start">
          <ScoreGauge score={fit.totalScore} size={96} label="적합도" />
          <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
            개발 예정지
          </span>
        </div>
        <div className="mt-4 md:mt-0">
          <h1 className="text-2xl font-bold">{area.name}</h1>
          {area.summary && (
            <p className="text-muted-foreground mt-1 text-sm">{area.summary}</p>
          )}
          {area.targetMoveInYear && (
            <p className="text-muted-foreground mt-1 text-sm">
              {area.targetMoveInYear}년 입주 예정
            </p>
          )}
        </div>
      </section>

      <section className="bg-surface border-border rounded-xl border p-4">
        <h2 className="mb-2 font-semibold">지역 지표</h2>
        <dl className="divide-border divide-y">
          {METRIC_LABELS.map(({ key, label }) => (
            <div key={key} className="flex justify-between py-1.5 text-sm">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium tabular-nums">
                {area.areaMetrics[key]}
              </dd>
            </div>
          ))}
        </dl>
        <p className="text-muted-foreground mt-2 text-xs">
          지역 적합도는 우리 우선순위 중 지역에 대응하는 축만으로 계산해요(가격·통근
          등은 제외). 지표는 현재 테스트용 데이터입니다.
        </p>
      </section>

      {candidate ? (
        <button
          type="button"
          onClick={() => removeCandidate(id, "area")}
          className="text-danger w-full rounded-md px-3 py-2 text-sm font-medium"
        >
          관심 지역에서 제거
        </button>
      ) : (
        <button
          type="button"
          onClick={() => addCandidate(id, "area")}
          className="bg-primary text-primary-foreground w-full rounded-md px-4 py-2.5 text-sm font-medium"
        >
          관심 지역으로 담기
        </button>
      )}

      <Link
        href="/"
        className="text-primary block text-center text-sm font-medium"
      >
        홈으로
      </Link>
    </PageContainer>
  );
}

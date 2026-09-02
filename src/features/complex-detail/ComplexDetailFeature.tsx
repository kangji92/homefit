"use client";

import Link from "next/link";
import { computeFit } from "@/domain/scoring";
import { PageContainer } from "@/components/layout/PageContainer";
import { useComplex, useRegions } from "@/hooks/queries";
import { isConditionsReady } from "@/lib/conditions";
import { useCandidatesStore } from "@/stores/candidatesStore";
import { useConditionsStore } from "@/stores/conditionsStore";
import { AxisScoreList } from "./AxisScoreList";
import { CandidateActions } from "./CandidateActions";
import { DealbreakerAlert } from "./DealbreakerAlert";
import { Hero } from "./Hero";
import { NotesEditor } from "./NotesEditor";
import { RawInfo } from "./RawInfo";

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center px-4 text-sm">
      {children}
    </div>
  );
}

export function ComplexDetailFeature({ id }: { id: string }) {
  const complexQuery = useComplex(id);
  const regionsQuery = useRegions();

  const condHydrated = useConditionsStore((s) => s.hasHydrated);
  const candHydrated = useCandidatesStore((s) => s.hasHydrated);
  const conditions = useConditionsStore((s) => s.conditions);
  const priorities = useConditionsStore((s) => s.priorities);
  const dealbreakers = useConditionsStore((s) => s.dealbreakers);

  const isCandidate = useCandidatesStore((s) =>
    s.candidates.some((c) => c.id === id),
  );

  // hydration 전에는 판정 보류(후보 버튼 flicker 방지)
  if (!condHydrated || !candHydrated) return <Center>불러오는 중…</Center>;
  if (complexQuery.isLoading) return <Center>불러오는 중…</Center>;
  if (complexQuery.isError) {
    return (
      <p role="alert" className="text-muted-foreground py-10 text-center text-sm">
        단지 정보를 불러오지 못했어요.
      </p>
    );
  }

  const complex = complexQuery.data;
  if (!complex) {
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        단지를 찾을 수 없어요.
      </p>
    );
  }

  const regionName = (regionsQuery.data ?? []).find(
    (r) => r.id === complex.regionId,
  )?.name;

  const ready = isConditionsReady(conditions);
  const fit = ready
    ? computeFit(conditions, priorities, dealbreakers, complex)
    : null;

  return (
    <PageContainer className="max-w-2xl space-y-4">
      <Hero
        complex={complex}
        regionName={regionName}
        fit={fit}
        dealType={conditions.dealType}
      />

      {fit && !fit.passesDealbreakers && (
        <DealbreakerAlert failed={fit.failedDealbreakers} />
      )}

      {!ready && (
        <div className="border-border rounded-xl border p-4 text-center">
          <p className="text-muted-foreground text-sm">
            우리 조건을 완성하면 적합도를 계산해요.
          </p>
          <Link
            href="/conditions"
            className="text-primary mt-2 inline-block text-sm font-medium"
          >
            조건 설정하기
          </Link>
        </div>
      )}

      {fit && (
        <details
          open
          className="bg-surface border-border rounded-xl border p-4"
        >
          <summary className="cursor-pointer font-semibold">
            항목별 적합도
          </summary>
          <div className="mt-3">
            <AxisScoreList axisScores={fit.axisScores} />
          </div>
        </details>
      )}

      <details className="bg-surface border-border rounded-xl border p-4">
        <summary className="cursor-pointer font-semibold">자세한 정보</summary>
        <div className="mt-3">
          <RawInfo
            complex={complex}
            workplaces={conditions.workplaces}
            dealType={conditions.dealType}
          />
        </div>
      </details>

      <CandidateActions complexId={id} />
      {isCandidate && <NotesEditor complexId={id} />}
    </PageContainer>
  );
}

"use client";

import { useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useComplexes, useRegions } from "@/hooks/queries";
import { isConditionsReady } from "@/lib/conditions";
import { recommendComplexes } from "@/features/home/recommend";
import { useCandidatesStore } from "@/stores/candidatesStore";
import { useConditionsStore } from "@/stores/conditionsStore";
import { cn } from "@/lib/utils";
import { CandidateCard } from "./CandidateCard";
import { DiscoverList } from "./DiscoverList";
import { RegionInterestList } from "./RegionInterestList";

type Tab = "complexes" | "regions";

export function CandidatesFeature() {
  const [tab, setTab] = useState<Tab>("complexes");

  const condHydrated = useConditionsStore((s) => s.hasHydrated);
  const candHydrated = useCandidatesStore((s) => s.hasHydrated);
  const conditions = useConditionsStore((s) => s.conditions);
  const priorities = useConditionsStore((s) => s.priorities);
  const dealbreakers = useConditionsStore((s) => s.dealbreakers);
  const candidates = useCandidatesStore((s) => s.candidates);

  const complexesQuery = useComplexes();
  const regionsQuery = useRegions();

  const regionName = useMemo(
    () => new Map((regionsQuery.data ?? []).map((r) => [r.id, r.name])),
    [regionsQuery.data],
  );

  const allComplexes = complexesQuery.data ?? [];
  const candidateIds = new Set(candidates.map((c) => c.complexId));
  const candidateComplexes = allComplexes.filter((c) => candidateIds.has(c.id));
  const ready = isConditionsReady(conditions);

  const recommendations = useMemo(
    () =>
      ready
        ? recommendComplexes(
            candidateComplexes,
            conditions,
            priorities,
            dealbreakers,
            candidateComplexes.length,
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, allComplexes, candidates, conditions, priorities, dealbreakers],
  );

  if (!condHydrated || !candHydrated) {
    return (
      <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center text-sm">
        불러오는 중…
      </div>
    );
  }

  return (
    <PageContainer className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">후보</h1>

      <div className="bg-surface-muted flex rounded-lg p-1 text-sm">
        <TabButton active={tab === "complexes"} onClick={() => setTab("complexes")}>
          관심 단지
        </TabButton>
        <TabButton active={tab === "regions"} onClick={() => setTab("regions")}>
          관심 지역
        </TabButton>
      </div>

      {tab === "complexes"
        ? renderComplexesTab()
        : <RegionInterestList regions={regionsQuery.data ?? []} />}
    </PageContainer>
  );

  function renderComplexesTab() {
    if (complexesQuery.isLoading) {
      return <Notice role="status">단지를 불러오는 중이에요…</Notice>;
    }
    if (complexesQuery.isError) {
      return <Notice role="alert">단지를 불러오지 못했어요.</Notice>;
    }

    if (candidateComplexes.length === 0) {
      return (
        <div className="space-y-4">
          <Notice>담은 후보가 없어요. 아래에서 둘러보고 담아보세요.</Notice>
          <section>
            <h2 className="mb-2 font-semibold">단지 둘러보기</h2>
            <DiscoverList complexes={allComplexes} regionName={regionName} />
          </section>
        </div>
      );
    }

    const cards = ready
      ? recommendations.map((r) => (
          <CandidateCard
            key={r.complex.id}
            complex={r.complex}
            fit={r.fit}
            regionName={regionName.get(r.complex.regionId)}
          />
        ))
      : candidateComplexes.map((c) => (
          <CandidateCard
            key={c.id}
            complex={c}
            regionName={regionName.get(c.regionId)}
          />
        ));

    return (
      <div className="space-y-4">
        <div className="space-y-3">{cards}</div>
        <details className="bg-surface border-border rounded-xl border p-4">
          <summary className="cursor-pointer font-semibold">단지 둘러보기</summary>
          <div className="mt-2">
            <DiscoverList complexes={allComplexes} regionName={regionName} />
          </div>
        </details>
      </div>
    );
  }
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex-1 rounded-md py-1.5 font-medium",
        active ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Notice({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: "status" | "alert";
}) {
  return (
    <p role={role} className="text-muted-foreground py-8 text-center text-sm">
      {children}
    </p>
  );
}

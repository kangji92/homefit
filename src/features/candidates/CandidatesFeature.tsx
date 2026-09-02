"use client";

import { useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useHomes, useRegions } from "@/hooks/queries";
import { isConditionsReady } from "@/lib/conditions";
import { recommendComplexes } from "@/features/home/recommend";
import { useCandidatesStore } from "@/stores/candidatesStore";
import { useConditionsStore } from "@/stores/conditionsStore";
import { cn } from "@/lib/utils";
import { CandidateCard } from "./CandidateCard";
import { DiscoverList } from "./DiscoverList";
import { RegionInterestList } from "./RegionInterestList";

type Tab = "complexes" | "regions";
type SortBy = "fit" | "recent";

export function CandidatesFeature() {
  const [tab, setTab] = useState<Tab>("complexes");
  const [sortBy, setSortBy] = useState<SortBy>("fit");
  const [favOnly, setFavOnly] = useState(false);

  const condHydrated = useConditionsStore((s) => s.hasHydrated);
  const candHydrated = useCandidatesStore((s) => s.hasHydrated);
  const conditions = useConditionsStore((s) => s.conditions);
  const priorities = useConditionsStore((s) => s.priorities);
  const dealbreakers = useConditionsStore((s) => s.dealbreakers);
  const candidates = useCandidatesStore((s) => s.candidates);

  const complexesQuery = useHomes();
  const regionsQuery = useRegions();

  const regionName = useMemo(
    () => new Map((regionsQuery.data ?? []).map((r) => [r.id, r.name])),
    [regionsQuery.data],
  );

  const allComplexes = complexesQuery.data ?? [];
  const candidateIds = new Set(candidates.map((c) => c.id));
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
            <DiscoverList
              complexes={allComplexes}
              regionName={regionName}
              dealType={conditions.dealType}
            />
          </section>
        </div>
      );
    }

    const fitById = new Map(recommendations.map((r) => [r.complex.id, r.fit]));
    const rankIndex = new Map(recommendations.map((r, i) => [r.complex.id, i]));
    const candById = new Map(candidates.map((c) => [c.id, c]));

    let items = candidateComplexes.map((c) => ({
      complex: c,
      fit: fitById.get(c.id),
      cand: candById.get(c.id),
    }));
    if (favOnly) items = items.filter((i) => i.cand?.favorite);
    items = items.slice().sort((x, y) => {
      if (sortBy === "recent") {
        return (y.cand?.addedAt ?? "").localeCompare(x.cand?.addedAt ?? "");
      }
      // 적합도순: 추천 랭킹(탈락 우선 → 총점 내림차순)을 그대로 따른다
      return (
        (rankIndex.get(x.complex.id) ?? Number.MAX_SAFE_INTEGER) -
        (rankIndex.get(y.complex.id) ?? Number.MAX_SAFE_INTEGER)
      );
    });

    const controls = (
      <div className="flex items-center justify-between gap-2 text-sm">
        <div className="bg-surface-muted flex rounded-lg p-0.5">
          <SortButton active={sortBy === "fit"} onClick={() => setSortBy("fit")}>
            적합도순
          </SortButton>
          <SortButton
            active={sortBy === "recent"}
            onClick={() => setSortBy("recent")}
          >
            최근 추가순
          </SortButton>
        </div>
        <button
          type="button"
          onClick={() => setFavOnly((v) => !v)}
          aria-pressed={favOnly}
          className={cn(
            "shrink-0 rounded-md px-2.5 py-1 font-medium",
            favOnly
              ? "bg-fit-medium/15 text-fit-medium"
              : "text-muted-foreground border-border border",
          )}
        >
          ★ 즐겨찾기만
        </button>
      </div>
    );

    const cards =
      items.length === 0 ? (
        <Notice>즐겨찾기한 후보가 없어요.</Notice>
      ) : (
        items.map((i) => (
          <CandidateCard
            key={i.complex.id}
            complex={i.complex}
            fit={ready ? i.fit : undefined}
            regionName={regionName.get(i.complex.regionId)}
            dealType={conditions.dealType}
          />
        ))
      );

    return (
      <div className="space-y-4">
        {controls}
        <div className="space-y-3">{cards}</div>
        <details className="bg-surface border-border rounded-xl border p-4">
          <summary className="cursor-pointer font-semibold">단지 둘러보기</summary>
          <div className="mt-2">
            <DiscoverList
              complexes={allComplexes}
              regionName={regionName}
              dealType={conditions.dealType}
            />
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

function SortButton({
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
        "rounded-md px-2.5 py-1 font-medium",
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

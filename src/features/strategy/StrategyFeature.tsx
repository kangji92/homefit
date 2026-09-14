"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { cn } from "@/lib/utils";
import { useAreas, useHomes } from "@/hooks/queries";
import { useConditionsStore } from "@/stores/conditionsStore";
import { useHouseholdStore } from "@/stores/householdStore";
import { useLivingContextStore } from "@/stores/livingContextStore";
import { isConditionsReady } from "@/lib/conditions";
import { CurrentContextBanner } from "@/features/currentHousing/CurrentContextBanner";
import { BaselineCard } from "@/features/currentHousing/BaselineCard";
import { DecisionMapView } from "@/features/decisionMap";
import { StrategyCard } from "./StrategyCard";
import { StrategyCompareTable } from "./StrategyCompareTable";
import { TradeoffSummary } from "./TradeoffSummary";
import {
  buildStrategyBoard,
  groupByKind,
  KIND_LABEL,
  pickCompareColumns,
} from "./strategyView";

type ViewMode = "cards" | "compare" | "map";

export function StrategyFeature() {
  const hasHydrated = useConditionsStore((s) => s.hasHydrated);
  const conditions = useConditionsStore((s) => s.conditions);
  const priorities = useConditionsStore((s) => s.priorities);
  const dealbreakers = useConditionsStore((s) => s.dealbreakers);
  const profile = useHouseholdStore((s) => s.profile);
  const currentHousing = useLivingContextStore((s) => s.current);
  const regionPrefs = useLivingContextStore((s) => s.regionPrefs);
  const [view, setView] = useState<ViewMode>("cards");

  const homesQuery = useHomes();
  const areasQuery = useAreas();
  const homes = useMemo(() => homesQuery.data ?? [], [homesQuery.data]);
  const areas = useMemo(() => areasQuery.data ?? [], [areasQuery.data]);

  const ready = isConditionsReady(conditions);

  const board = useMemo(() => {
    if (!ready) return [];
    return buildStrategyBoard({
      conditions,
      priorities,
      dealbreakers,
      profile,
      homes,
      areas,
      currentYear: new Date().getFullYear(),
      currentHousing,
      regionPrefs,
    });
  }, [ready, conditions, priorities, dealbreakers, profile, homes, areas, currentHousing, regionPrefs]);

  const kindGroups = useMemo(() => groupByKind(board), [board]);
  const compareColumns = useMemo(() => pickCompareColumns(board), [board]);

  return (
    <PageContainer className="max-w-2xl">
      <header className="mb-4">
        <h1 className="text-xl font-bold">주거 전략</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          어떤 집을 살까가 아니라, <b>어떻게 들어갈지</b>를 비교해요. 매수·청약·
          전세 후 청약·분양권을 우리 가족 조건으로 나란히 봅니다.
        </p>
      </header>

      {hasHydrated && ready && <div className="mb-4"><CurrentContextBanner /></div>}

      {!hasHydrated ? (
        <p className="text-muted-foreground text-sm">불러오는 중…</p>
      ) : !ready ? (
        <EmptyState
          title="먼저 우리 조건을 알려주세요"
          body="예산·자금·통근지를 입력하면 가능한 주거 전략을 만들어 드려요."
          href="/conditions"
          cta="우리 조건 입력"
        />
      ) : homesQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">전략을 만드는 중…</p>
      ) : board.length === 0 ? (
        <EmptyState
          title="지금 조건에 맞는 전략이 없어요"
          body="예산을 넓히거나 탐색에서 관심 매물을 늘려보세요."
          href="/explore"
          cta="탐색으로 이동"
        />
      ) : (
        <>
          {/* 보기 전환: 카드(탐색) ⇄ 나란히 비교(결정) */}
          {compareColumns.length >= 2 && (
            <div className="border-border mb-4 inline-flex rounded-lg border p-0.5 text-sm">
              <ToggleButton active={view === "cards"} onClick={() => setView("cards")}>
                카드로 보기
              </ToggleButton>
              <ToggleButton active={view === "compare"} onClick={() => setView("compare")}>
                나란히 비교
              </ToggleButton>
              <ToggleButton active={view === "map"} onClick={() => setView("map")}>
                지도
              </ToggleButton>
            </div>
          )}

          {view === "map" && compareColumns.length >= 1 ? (
            <section>
              <p className="text-muted-foreground mb-3 text-xs">
                현재 위치에서 각 전략이 공간적으로 어떤 변화인지 봅니다. 결정은 카드에서,
                지도는 설명을 돕습니다.
              </p>
              <DecisionMapView
                board={board}
                homes={homes}
                areas={areas}
                workplaces={conditions.workplaces}
                currentHousing={currentHousing}
              />
            </section>
          ) : view === "compare" && compareColumns.length >= 2 ? (
            <section>
              {/* 기준점(baseline): 현재 유지 — 아래 +/-의 기준 */}
              <div className="mb-3">
                <BaselineCard />
              </div>
              {/* 의사결정용 요약(먼저) */}
              <TradeoffSummary columns={compareColumns} />
              {/* 근거 확인용 표(아래) */}
              <h2 className="text-sm font-semibold">항목별 비교 (근거 확인)</h2>
              <p className="text-muted-foreground mb-3 text-xs">
                같은 축으로 비교해요. 종합점수로 줄세우지 않고, 각 축에서 무엇이
                유리한지만 표시합니다.
              </p>
              <StrategyCompareTable columns={compareColumns} />
            </section>
          ) : (
            <div className="space-y-6">
              {/* 기준점(baseline): 현재 유지 */}
              <BaselineCard />
              {/* 1차 grouping = 전략 종류(strategy-first). status는 카드 배지로. */}
              {kindGroups.map(({ kind, items }) => (
                <section key={kind}>
                  <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    {KIND_LABEL[kind]}
                    <span className="text-muted-foreground font-normal">
                      {items.length}
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <StrategyCard key={item.strategy.id} item={item} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}

function ToggleButton({
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
        "rounded-md px-3 py-1.5 font-medium",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function EmptyState({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="border-border rounded-xl border border-dashed p-6 text-center">
      <p className="font-semibold">{title}</p>
      <p className="text-muted-foreground mt-1 text-sm">{body}</p>
      <Link
        href={href}
        className="bg-primary text-primary-foreground mt-4 inline-block rounded-lg px-4 py-2 text-sm font-medium"
      >
        {cta}
      </Link>
    </div>
  );
}

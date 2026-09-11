"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useAreas, useHomes } from "@/hooks/queries";
import { useConditionsStore } from "@/stores/conditionsStore";
import { useHouseholdStore } from "@/stores/householdStore";
import { useLivingContextStore } from "@/stores/livingContextStore";
import { isConditionsReady } from "@/lib/conditions";
import { CurrentContextBanner } from "@/features/currentHousing/CurrentContextBanner";
import { BaselineCard } from "@/features/currentHousing/BaselineCard";
import { StrategyCard } from "./StrategyCard";
import { buildStrategyBoard, firstChecks, pickCompareColumns } from "./strategyView";

/**
 * 홈의 **주인공** 섹션: 단지 랭킹이 아니라 "우리 가족에게 가능한 주거 선택"을
 * 전면에 둔다. 전략 종류별 대표 1개 + 먼저 확인할 것 체크리스트. (housing-strategy.md §17.3)
 * 조건 미완성/전략 없음이면 null(홈의 기존 안내가 대신 처리).
 */
export function StrategyHomeSection() {
  const conditions = useConditionsStore((s) => s.conditions);
  const priorities = useConditionsStore((s) => s.priorities);
  const dealbreakers = useConditionsStore((s) => s.dealbreakers);
  const profile = useHouseholdStore((s) => s.profile);
  const currentHousing = useLivingContextStore((s) => s.current);
  const regionPrefs = useLivingContextStore((s) => s.regionPrefs);
  const homes = useHomes().data;
  const areas = useAreas().data;

  const board = useMemo(() => {
    if (!isConditionsReady(conditions) || !homes) return [];
    return buildStrategyBoard({
      conditions,
      priorities,
      dealbreakers,
      profile,
      homes,
      areas: areas ?? [],
      currentYear: new Date().getFullYear(),
      currentHousing,
      regionPrefs,
    });
  }, [conditions, priorities, dealbreakers, profile, homes, areas, currentHousing, regionPrefs]);

  const top = useMemo(() => pickCompareColumns(board).slice(0, 3), [board]);
  const checks = useMemo(() => firstChecks(board), [board]);

  if (board.length === 0) return null;

  return (
    <div className="space-y-5">
      <section aria-label="가능한 주거 선택" className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold">우리 가족에게 가능한 주거 선택</h2>
            <p className="text-muted-foreground text-xs">
              어떤 집이 아니라 <b>어떻게 들어갈지</b>를 비교해요
            </p>
          </div>
          <Link href="/strategy" className="text-primary shrink-0 text-sm font-medium">
            전체 보기
          </Link>
        </div>
        <CurrentContextBanner />
        <BaselineCard />
        {top.map((item) => (
          <StrategyCard key={item.strategy.id} item={item} />
        ))}
      </section>

      {checks.length > 0 && (
        <section aria-label="먼저 확인할 것" className="bg-surface-muted rounded-xl p-4">
          <h2 className="text-sm font-bold">지금 가장 먼저 확인할 것</h2>
          <ul className="mt-2 divide-y divide-border/60">
            {checks.map((c) => (
              <li key={c.href + c.label}>
                <Link href={c.href} className="flex items-center justify-between py-2 text-sm font-medium">
                  {c.label}
                  <ChevronRight className="text-muted-foreground size-4" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

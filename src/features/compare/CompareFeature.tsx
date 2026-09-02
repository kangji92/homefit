"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { computeFit } from "@/domain/scoring";
import { compareFit } from "@/domain/scoring/compare";
import type { Priorities } from "@/domain/types";
import { useComplexes, useRegions } from "@/hooks/queries";
import { isConditionsReady } from "@/lib/conditions";
import { useCandidatesStore } from "@/stores/candidatesStore";
import { useConditionsStore } from "@/stores/conditionsStore";
import { ComparisonView } from "./ComparisonView";
import { SimulationPanel } from "./SimulationPanel";

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground py-10 text-center text-sm">{children}</p>
  );
}

export function CompareFeature() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const condHydrated = useConditionsStore((s) => s.hasHydrated);
  const candHydrated = useCandidatesStore((s) => s.hasHydrated);
  const conditions = useConditionsStore((s) => s.conditions);
  const priorities = useConditionsStore((s) => s.priorities);
  const dealbreakers = useConditionsStore((s) => s.dealbreakers);
  const candidates = useCandidatesStore((s) => s.candidates);

  // 시뮬레이션: null이면 저장된 우선순위를 그대로 사용(휘발성 실험)
  const [simPriorities, setSimPriorities] = useState<Priorities | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const effectivePriorities = simPriorities ?? priorities;

  const complexesQuery = useComplexes();
  const regionsQuery = useRegions();

  if (!condHydrated || !candHydrated) {
    return (
      <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center text-sm">
        불러오는 중…
      </div>
    );
  }

  const allComplexes = complexesQuery.data ?? [];
  const byId = new Map(allComplexes.map((c) => [c.id, c]));
  const regionName = new Map((regionsQuery.data ?? []).map((r) => [r.id, r.name]));
  const candidateIds = new Set(candidates.map((c) => c.complexId));
  const candidateComplexes = allComplexes.filter((c) => candidateIds.has(c.id));

  const a = searchParams.get("a") ?? "";
  const b = searchParams.get("b") ?? "";

  const setPair = (nextA: string, nextB: string) => {
    const params = new URLSearchParams();
    if (nextA) params.set("a", nextA);
    if (nextB) params.set("b", nextB);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const body = () => {
    if (complexesQuery.isLoading) return <Notice>단지를 불러오는 중이에요…</Notice>;
    if (complexesQuery.isError) return <Notice>단지를 불러오지 못했어요.</Notice>;
    if (!isConditionsReady(conditions)) {
      return (
        <div className="py-10 text-center">
          <p className="text-muted-foreground text-sm">
            우리 조건을 완성하면 비교할 수 있어요.
          </p>
          <Link
            href="/conditions"
            className="text-primary mt-2 inline-block text-sm font-medium"
          >
            조건 설정하기
          </Link>
        </div>
      );
    }
    if (candidateComplexes.length < 2) {
      return (
        <div className="py-10 text-center">
          <p className="text-muted-foreground text-sm">
            비교하려면 후보를 2개 이상 담아주세요.
          </p>
          <Link
            href="/candidates"
            className="text-primary mt-2 inline-block text-sm font-medium"
          >
            후보 담으러 가기
          </Link>
        </div>
      );
    }

    // 후보에 없는(직접 URL·제거된) id는 무시
    const complexA = candidateIds.has(a) ? byId.get(a) : undefined;
    const complexB = candidateIds.has(b) ? byId.get(b) : undefined;

    const selector = (
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="cmp-a" className="text-sm font-medium">
            비교 후보 A
          </label>
          <select
            id="cmp-a"
            value={a}
            onChange={(e) => setPair(e.target.value, b)}
            className="border-border bg-surface mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">선택</option>
            {candidateComplexes.map((c) => (
              <option key={c.id} value={c.id} disabled={c.id === b}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cmp-b" className="text-sm font-medium">
            비교 후보 B
          </label>
          <select
            id="cmp-b"
            value={b}
            onChange={(e) => setPair(a, e.target.value)}
            className="border-border bg-surface mt-1 w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">선택</option>
            {candidateComplexes.map((c) => (
              <option key={c.id} value={c.id} disabled={c.id === a}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    );

    if (!complexA || !complexB) {
      return (
        <div className="space-y-4">
          {selector}
          <Notice>비교할 후보 2개를 선택하세요.</Notice>
        </div>
      );
    }

    // 시뮬레이션 중이면 조정된 우선순위로 계산 (절대조건은 가중치와 무관)
    const fitA = computeFit(conditions, effectivePriorities, dealbreakers, complexA);
    const fitB = computeFit(conditions, effectivePriorities, dealbreakers, complexB);
    const comparison = compareFit(fitA, fitB);

    const handleSimChange = (next: Priorities) => {
      setSavedFlash(false);
      setSimPriorities(next);
    };
    const handleSimReset = () => {
      setSavedFlash(false);
      setSimPriorities(null);
    };
    const handleSimSave = () => {
      useConditionsStore.getState().setPriorities(effectivePriorities);
      setSimPriorities(effectivePriorities); // 저장값과 동일 → "변경됨" 해제
      setSavedFlash(true);
    };

    return (
      <div className="space-y-4">
        {selector}
        <ComparisonView
          a={{ complex: complexA, fit: fitA, regionName: regionName.get(complexA.regionId) }}
          b={{ complex: complexB, fit: fitB, regionName: regionName.get(complexB.regionId) }}
          comparison={comparison}
          workplaces={conditions.workplaces}
          dealType={conditions.dealType}
        />
        <SimulationPanel
          value={effectivePriorities}
          saved={priorities}
          onChange={handleSimChange}
          onReset={handleSimReset}
          onSave={handleSimSave}
          savedFlash={savedFlash}
        />
      </div>
    );
  };

  return (
    <PageContainer className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">비교</h1>
      {body()}
    </PageContainer>
  );
}

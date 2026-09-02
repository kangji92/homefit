"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { computeAreaFit } from "@/domain/scoring";
import { upcomingSubscriptions } from "@/domain/subscription";
import { useAreas, useHomes, useRegions } from "@/hooks/queries";
import { useConditionsStore } from "@/stores/conditionsStore";
import { AreaCard } from "@/features/area/AreaCard";
import { ConditionsSummary } from "./ConditionsSummary";
import { RecommendationCard } from "./RecommendationCard";
import { UpcomingSubscriptions } from "./UpcomingSubscriptions";
import { isConditionsReady, recommendComplexes } from "./recommend";

function Notice({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: "status" | "alert";
}) {
  return (
    <p role={role} className="text-muted-foreground py-10 text-center text-sm">
      {children}
    </p>
  );
}

export function HomeFeature() {
  const router = useRouter();
  const hasHydrated = useConditionsStore((s) => s.hasHydrated);
  const onboardingCompleted = useConditionsStore((s) => s.onboardingCompleted);
  const conditions = useConditionsStore((s) => s.conditions);
  const priorities = useConditionsStore((s) => s.priorities);
  const dealbreakers = useConditionsStore((s) => s.dealbreakers);

  const complexesQuery = useHomes();
  const regionsQuery = useRegions();
  const areasQuery = useAreas();

  const areaFits = useMemo(
    () =>
      (areasQuery.data ?? []).map((area) => ({
        area,
        fit: computeAreaFit(priorities, area),
      })),
    [areasQuery.data, priorities],
  );

  const todayISO = new Date().toISOString().slice(0, 10);
  const subscriptions = useMemo(
    () => upcomingSubscriptions(complexesQuery.data ?? [], todayISO),
    [complexesQuery.data, todayISO],
  );

  const regionName = useMemo(
    () => new Map((regionsQuery.data ?? []).map((r) => [r.id, r.name])),
    [regionsQuery.data],
  );

  const recommendations = useMemo(
    () =>
      isConditionsReady(conditions)
        ? recommendComplexes(
            complexesQuery.data ?? [],
            conditions,
            priorities,
            dealbreakers,
          )
        : [],
    [complexesQuery.data, conditions, priorities, dealbreakers],
  );

  // 온보딩 미완료 시 유도 (hydration 이후에만 판정 → 잘못된 redirect 방지)
  useEffect(() => {
    if (hasHydrated && !onboardingCompleted) router.replace("/onboarding");
  }, [hasHydrated, onboardingCompleted, router]);

  if (!hasHydrated || !onboardingCompleted) {
    return (
      <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center text-sm">
        불러오는 중…
      </div>
    );
  }

  return (
    <PageContainer className="space-y-6">
      <ConditionsSummary conditions={conditions} />
      <UpcomingSubscriptions items={subscriptions} />
      {renderContent()}
      {renderAreas()}
    </PageContainer>
  );

  function renderAreas() {
    if (areaFits.length === 0) return null;
    return (
      <section aria-label="개발 예정지" className="space-y-3">
        <div>
          <h2 className="text-lg font-bold">개발 예정지</h2>
          <p className="text-muted-foreground text-xs">
            3기신도시 등 · 지역 적합도(AreaFit)
          </p>
        </div>
        {areaFits.map(({ area, fit }) => (
          <AreaCard key={area.id} area={area} fit={fit} />
        ))}
      </section>
    );
  }

  function renderContent() {
    if (!isConditionsReady(conditions)) {
      return (
        <div className="py-10 text-center">
          <p className="text-muted-foreground text-sm">
            우리 조건을 먼저 완성해주세요.
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
    if (complexesQuery.isLoading) {
      return <Notice role="status">추천을 불러오는 중이에요…</Notice>;
    }
    if (complexesQuery.isError) {
      return <Notice role="alert">추천을 불러오지 못했어요.</Notice>;
    }
    if (recommendations.length === 0) {
      return <Notice>표시할 단지가 없어요.</Notice>;
    }
    return (
      <section aria-label="추천 주택" className="space-y-3">
        <h2 className="text-lg font-bold">추천 주택</h2>
        {recommendations.map((r) => (
          <RecommendationCard
            key={r.complex.id}
            recommendation={r}
            regionName={regionName.get(r.complex.regionId)}
            dealType={conditions.dealType}
          />
        ))}
      </section>
    );
  }
}

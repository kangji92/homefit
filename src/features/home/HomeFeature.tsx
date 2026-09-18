"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { computeAreaFit } from "@/domain/scoring";
import { upcomingSubscriptions, subscriptionNotices } from "@/domain/subscription";
import { SubscriptionNoticesPanel } from "@/features/subscription/SubscriptionNoticesPanel";
import { useAreas, useDevelopments, useHomes, useRegions } from "@/hooks/queries";
import { useConditionsStore } from "@/stores/conditionsStore";
import { AreaCard } from "@/features/area/AreaCard";
import { DevelopmentAreaCard } from "@/features/decisionMap";
import { sortDevelopmentsByProgress, computeDevelopmentLocalFit } from "@/domain/development";
import { LoginButton } from "@/features/auth/LoginButton";
import { StrategyHomeSection } from "@/features/strategy/StrategyHomeSection";
import { ConditionsSummary } from "./ConditionsSummary";
import { RecommendationCard } from "./RecommendationCard";
import { UpcomingSubscriptions } from "./UpcomingSubscriptions";
import { HomeQuickMenu } from "./HomeQuickMenu";
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
  const developmentsQuery = useDevelopments();
  const developments = useMemo(
    () => sortDevelopmentsByProgress(developmentsQuery.data ?? []),
    [developmentsQuery.data],
  );

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
  const notices = useMemo(
    () => subscriptionNotices(complexesQuery.data ?? [], todayISO),
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
    <PageContainer className="max-w-2xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">결정</h1>
        <p className="text-muted-foreground text-sm">
          우리 가족이 지금 매수할지, 기다릴지, 다른 선택지를 볼지 정리해요.
        </p>
      </header>
      {/* 상단 퀵메뉴 — 스크롤 아래 묻히던 하위 기능(청약·정비사업·현장매물·개발예정지) 바로 진입 */}
      <HomeQuickMenu />
      {/* 청약 소식 — 최근/임박 모집공고 하이라이트(전체 일정은 아래 '청약 일정') */}
      <SubscriptionNoticesPanel notices={notices} />
      <LoginButton />
      <ConditionsSummary conditions={conditions} />
      {/* 주인공: 주거 전략 Decision View */}
      <StrategyHomeSection />
      {/* 이하 보조: 청약 일정 · 추천 단지 · 개발예정지 */}
      <Supplement title="청약 일정" count={subscriptions.length}>
        <UpcomingSubscriptions items={subscriptions} />
      </Supplement>
      {renderContent()}
      {renderAreas()}
      {renderDevelopments()}
    </PageContainer>
  );

  function renderDevelopments() {
    if (developments.length === 0) return null;
    return (
      <Supplement title="정비사업 구역" count={developments.length}>
        <section aria-label="정비사업 구역" className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold">진행 중인 정비사업</h2>
            <p className="text-muted-foreground text-xs">
              재개발·재건축 등 진행 사업이에요. 적합도 점수에 넣지 않는 판단 보조 정보예요.
            </p>
          </div>
          {developments.map((area) => (
            <DevelopmentAreaCard key={area.id} area={area} localFit={computeDevelopmentLocalFit(priorities, area)?.totalScore} />
          ))}
        </section>
      </Supplement>
    );
  }

  function renderAreas() {
    if (areaFits.length === 0) return null;
    return (
      <Supplement title="개발 예정지" count={areaFits.length}>
      <section aria-label="개발 예정지" className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">검토할 개발 예정지</h2>
          <p className="text-muted-foreground text-xs">
            기다리는 선택지를 판단할 때 참고할 지역이에요.
          </p>
        </div>
        {areaFits.map(({ area, fit }) => (
          <AreaCard key={area.id} area={area} fit={fit} />
        ))}
      </section>
      </Supplement>
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
      return <Notice role="status">검토할 후보를 불러오는 중이에요…</Notice>;
    }
    if (complexesQuery.isError) {
      return <Notice role="alert">검토할 후보를 불러오지 못했어요.</Notice>;
    }
    if (recommendations.length === 0) {
      return <Notice>지금 참고할 후보가 없어요.</Notice>;
    }
    return (
      <section aria-label="결정에 참고할 후보" className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-muted-foreground text-sm font-semibold">
              결정에 참고할 후보
            </h2>
            <p className="text-muted-foreground text-xs">
              선택지를 좁힐 때 검토할 이유가 있는 집이에요
            </p>
          </div>
          <Link href="/explore" className="text-primary shrink-0 text-sm font-medium">
            더 탐색
          </Link>
        </div>
        {recommendations.slice(0, 3).map((r) => (
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

function Supplement({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <details className="bg-surface-muted rounded-xl p-4">
      <summary className="cursor-pointer text-sm font-semibold">
        보조 후보 · {title} {count > 0 ? count : ""}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

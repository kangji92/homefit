"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layout/PageContainer";
import { DEAL_TYPE_LABEL } from "@/domain/price";
import type { DealType } from "@/domain/types";
import { useAreas, useHomes, useRegions } from "@/hooks/queries";
import { useConditionsStore } from "@/stores/conditionsStore";
import { isConditionsReady } from "@/lib/conditions";
import { AreaCard } from "@/features/area/AreaCard";
import { RecommendationCard } from "@/features/home/RecommendationCard";
import {
  searchListings,
  type ListingKindFilter,
  type SearchParams,
  type SortKey,
} from "./search";

const KIND_TABS: { value: ListingKindFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "existing", label: "기존" },
  { value: "presale", label: "분양" },
  { value: "area", label: "개발예정지" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "fit", label: "적합도순" },
  { value: "price", label: "가격순" },
  { value: "newest", label: "최신순" },
];

const controlCls =
  "border-border bg-surface rounded-md border px-3 py-2 text-sm";

export function ExploreFeature() {
  const hasHydrated = useConditionsStore((s) => s.hasHydrated);
  const conditions = useConditionsStore((s) => s.conditions);
  const priorities = useConditionsStore((s) => s.priorities);
  const dealbreakers = useConditionsStore((s) => s.dealbreakers);

  const homesQuery = useHomes();
  const areasQuery = useAreas();
  const regionsQuery = useRegions();

  const [q, setQ] = useState("");
  const [regionId, setRegionId] = useState<string>("all");
  const [dealType, setDealType] = useState<DealType>(conditions.dealType);
  const [kind, setKind] = useState<ListingKindFilter>("all");
  const [priceMaxRaw, setPriceMaxRaw] = useState<number | null>(null);
  const [sizeMinRaw, setSizeMinRaw] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>("fit");

  const homes = useMemo(() => homesQuery.data ?? [], [homesQuery.data]);
  const areas = useMemo(() => areasQuery.data ?? [], [areasQuery.data]);
  const regions = useMemo(() => regionsQuery.data ?? [], [regionsQuery.data]);
  const regionName = useMemo(
    () => new Map(regions.map((r) => [r.id, r.name])),
    [regions],
  );

  // 슬라이더 경계값을 데이터에서 도출.
  const priceBound = useMemo(() => {
    const vals = homes
      .map((h) => (dealType === "sale" ? h.price.sale : h.price.jeonse)?.representative)
      .filter((v): v is number => v !== undefined);
    return vals.length ? Math.ceil(Math.max(...vals) / 1000) * 1000 : 0;
  }, [homes, dealType]);
  const sizeBound = useMemo(() => {
    const vals = homes.flatMap((h) => h.sizesPyeong);
    return vals.length ? Math.max(...vals) : 0;
  }, [homes]);

  const params: SearchParams = {
    q,
    regionId,
    dealType,
    kind,
    priceMax: priceMaxRaw ?? undefined,
    sizeMin: sizeMinRaw ?? undefined,
    sort,
  };

  const conditionsReady = isConditionsReady(conditions);
  const results = useMemo(
    () =>
      searchListings(homes, areas, params, {
        conditions,
        priorities,
        dealbreakers,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [homes, areas, q, regionId, dealType, kind, priceMaxRaw, sizeMinRaw, sort, conditions, priorities, dealbreakers],
  );

  function resetFilters() {
    setQ("");
    setRegionId("all");
    setKind("all");
    setPriceMaxRaw(null);
    setSizeMinRaw(null);
    setSort("fit");
  }

  if (!hasHydrated || homesQuery.isLoading || areasQuery.isLoading) {
    return (
      <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center text-sm">
        불러오는 중…
      </div>
    );
  }

  const total = results.homes.length + results.areas.length;

  return (
    <PageContainer className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">탐색</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          조건을 걸어 직접 찾아보세요. 추천과 달리 조건에 안 맞는 매물도 배지로
          함께 보여줘요.
        </p>
      </div>

      {!conditionsReady && (
        <p className="bg-surface-muted text-muted-foreground rounded-md p-3 text-xs">
          우리 조건이 아직 완성되지 않아 적합도가 정확하지 않을 수 있어요.{" "}
          <Link href="/conditions" className="text-primary font-medium">
            조건 완성하기
          </Link>
        </p>
      )}

      {/* 필터 */}
      <div className="space-y-3">
        <input
          type="search"
          aria-label="이름 검색"
          placeholder="단지·지역 이름 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={`${controlCls} w-full`}
        />

        <div className="flex gap-2">
          <label className="flex-1">
            <span className="sr-only">지역</span>
            <select
              aria-label="지역"
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
              className={`${controlCls} w-full`}
            >
              <option value="all">지역 전체</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1">
            <span className="sr-only">거래유형</span>
            <select
              aria-label="거래유형"
              value={dealType}
              onChange={(e) => setDealType(e.target.value as DealType)}
              className={`${controlCls} w-full`}
            >
              <option value="sale">{DEAL_TYPE_LABEL.sale}</option>
              <option value="jeonse">{DEAL_TYPE_LABEL.jeonse}</option>
            </select>
          </label>
        </div>

        {/* 유형 탭 */}
        <div role="tablist" aria-label="유형" className="flex gap-1.5">
          {KIND_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={kind === t.value}
              onClick={() => setKind(t.value)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                kind === t.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-muted text-muted-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 가격·평형 슬라이더 (집에만 적용) */}
        {priceBound > 0 && (
          <label className="block">
            <span className="text-muted-foreground text-xs">
              가격 상한:{" "}
              {priceMaxRaw === null
                ? "제한 없음"
                : `${priceMaxRaw.toLocaleString()}만원 이하`}
            </span>
            <input
              type="range"
              aria-label="가격 상한"
              min={0}
              max={priceBound}
              step={1000}
              value={priceMaxRaw ?? priceBound}
              onChange={(e) => {
                const v = Number(e.target.value);
                setPriceMaxRaw(v >= priceBound ? null : v);
              }}
              className="mt-1 w-full"
            />
          </label>
        )}
        {sizeBound > 0 && (
          <label className="block">
            <span className="text-muted-foreground text-xs">
              평형 최소:{" "}
              {sizeMinRaw === null ? "제한 없음" : `${sizeMinRaw}평 이상`}
            </span>
            <input
              type="range"
              aria-label="평형 최소"
              min={0}
              max={sizeBound}
              step={1}
              value={sizeMinRaw ?? 0}
              onChange={(e) => {
                const v = Number(e.target.value);
                setSizeMinRaw(v <= 0 ? null : v);
              }}
              className="mt-1 w-full"
            />
          </label>
        )}

        <label className="block">
          <span className="sr-only">정렬</span>
          <select
            aria-label="정렬"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className={`${controlCls} w-full`}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* 결과 */}
      {total === 0 ? (
        <div className="py-10 text-center">
          <p className="text-muted-foreground text-sm">
            조건에 맞는 매물이 없어요.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="text-primary mt-2 text-sm font-medium"
          >
            필터 초기화
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {results.homes.length > 0 && (
            <section aria-label="집" className="space-y-3">
              <h2 className="text-lg font-bold">집 ({results.homes.length})</h2>
              {results.homes.map((r) => (
                <RecommendationCard
                  key={r.complex.id}
                  recommendation={r}
                  regionName={regionName.get(r.complex.regionId)}
                  dealType={dealType}
                />
              ))}
            </section>
          )}
          {results.areas.length > 0 && (
            <section aria-label="개발 예정지" className="space-y-3">
              <div>
                <h2 className="text-lg font-bold">
                  개발 예정지 ({results.areas.length})
                </h2>
                <p className="text-muted-foreground text-xs">
                  가격·평형·거래유형 필터는 집에만 적용돼요.
                </p>
              </div>
              {results.areas.map(({ area, fit }) => (
                <AreaCard key={area.id} area={area} fit={fit} />
              ))}
            </section>
          )}
        </div>
      )}
    </PageContainer>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PageContainer } from "@/components/layout/PageContainer";
import { DEAL_TYPE_LABEL } from "@/domain/price";
import type { DealType } from "@/domain/types";
import type { AcquisitionPath } from "@/domain/types";
import { useAreas, useDevelopments, useHomes, useRegions } from "@/hooks/queries";
import { DevelopmentAreaCard, FieldPropertyCTA } from "@/features/decisionMap";
import { sortDevelopmentsByProgress, computeDevelopmentLocalFit } from "@/domain/development";
import type { DevelopmentType } from "@/domain/development";
import { useConditionsStore } from "@/stores/conditionsStore";
import { isConditionsReady } from "@/lib/conditions";
import { AreaCard } from "@/features/area/AreaCard";
import { RecommendationCard } from "@/features/home/RecommendationCard";
import { CandidateToggleButton } from "@/features/candidates/CandidateToggleButton";
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
  // 개발예정지 + 정비사업 + 철도를 "개발 호재"로 묶음(성격별 chip 필터). (development-catalyst.md §4)
  { value: "development", label: "개발 호재" },
];

// 개발 호재 카테고리 chip. 툴팁(title)로 뜻 설명.
type CatalystCat = "all" | "redev" | "railway" | "new_town";
const CATALYST_CHIPS: { value: CatalystCat; label: string; tip: string }[] = [
  { value: "all", label: "전체", tip: "정비·철도·신도시 전부" },
  { value: "redev", label: "정비·건설", tip: "재개발·재건축 등 정비사업" },
  { value: "railway", label: "철도", tip: "철도·역세권 개발(접근성 정보)" },
  { value: "new_town", label: "신도시", tip: "신도시·택지 개발예정지" },
];
function inCatalystCat(t: DevelopmentType, cat: CatalystCat): boolean {
  if (cat === "all") return true;
  if (cat === "redev") return t === "redevelopment" || t === "reconstruction";
  if (cat === "railway") return t === "railway";
  return t === "new_town"; // new_town
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "fit", label: "검토 우선순" },
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
  const developmentsQuery = useDevelopments();

  // 홈 퀵메뉴 등에서 ?kind=presale|development|area로 초기 탭 선택(‌/strategy?view=map과 동일 패턴).
  const kindParam = useSearchParams()?.get("kind");
  const [q, setQ] = useState("");
  const [regionId, setRegionId] = useState<string>("all");
  const [dealType, setDealType] = useState<DealType>(conditions.dealType);
  const [kind, setKind] = useState<ListingKindFilter>(
    KIND_TABS.some((t) => t.value === kindParam) ? (kindParam as ListingKindFilter) : "all",
  );
  const [priceMaxRaw, setPriceMaxRaw] = useState<number | null>(null);
  const [sizeMinRaw, setSizeMinRaw] = useState<number | null>(null);
  const [acquisitionPath, setAcquisitionPath] = useState<AcquisitionPath | "">("");
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
    acquisitionPath: acquisitionPath || undefined,
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
    [homes, areas, q, regionId, dealType, kind, priceMaxRaw, sizeMinRaw, acquisitionPath, sort, conditions, priorities, dealbreakers],
  );

  // 정비사업 구역(비점수 레이어) — 이름/지역 필터만. 집/개발예정지 검색과 분리.
  const developments = useMemo(() => developmentsQuery.data ?? [], [developmentsQuery.data]);
  const devResults = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return sortDevelopmentsByProgress(
      developments.filter(
        (d) =>
          (needle === "" || d.name.toLowerCase().includes(needle)) &&
          (regionId === "all" || d.regionId === regionId),
      ),
    );
  }, [developments, q, regionId]);
  const showDev = kind === "all" || kind === "development";
  // 개발 호재 카테고리(정비/철도/신도시) chip. 개발 호재 탭에서만 사용.
  const [catalystCat, setCatalystCat] = useState<CatalystCat>("all");
  const catalystDevs = useMemo(
    () => devResults.filter((d) => inCatalystCat(d.developmentType, catalystCat)),
    [devResults, catalystCat],
  );
  // 지역 적합도(위치·교통·학군) — 개발 성과가 아님. seed 있는 구역만 점수.
  const localFitOf = (a: (typeof developments)[number]) => computeDevelopmentLocalFit(priorities, a)?.totalScore;

  function resetFilters() {
    setQ("");
    setRegionId("all");
    setKind("all");
    setPriceMaxRaw(null);
    setSizeMinRaw(null);
    setAcquisitionPath("");
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
  const primaryHomes = results.homes.slice(0, 6);
  const extraHomes = results.homes.slice(6);
  const primaryAreas = results.areas.slice(0, 3);
  const extraAreas = results.areas.slice(3);

  return (
    <PageContainer className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold">탐색</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          결정에 넣어볼 후보와 검토 이유를 찾는 곳이에요. 조건에 안 맞는 항목도
          확인할 점으로 함께 보여줘요.
        </p>
      </div>

      {!conditionsReady && (
        <p className="bg-surface-muted text-muted-foreground rounded-md p-3 text-xs">
          우리 조건이 아직 완성되지 않아 검토 우선순위가 정확하지 않을 수 있어요.{" "}
          <Link href="/conditions" className="text-primary font-medium">
            조건 완성하기
          </Link>
        </p>
      )}

      {/* 현장 매물 분석 진입 — 부동산에서 직접 본 재개발 매물의 총투입액 계산 */}
      <FieldPropertyCTA />

      {/* 필터 */}
      <div className="space-y-3">
        <input
          type="search"
          aria-label="이름 검색"
          placeholder="단지·지역 이름으로 후보 찾기"
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
          <span className="sr-only">취득경로</span>
          <select
            aria-label="취득경로"
            value={acquisitionPath}
            onChange={(e) =>
              setAcquisitionPath(e.target.value as AcquisitionPath | "")
            }
            className={`${controlCls} w-full`}
          >
            <option value="">검토 방식 전체</option>
            <option value="subscription">청약 가능</option>
            <option value="resale">분양권 거래 가능</option>
          </select>
        </label>

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
      {total === 0 && !(showDev && devResults.length > 0) ? (
        <div className="py-10 text-center">
          <p className="text-muted-foreground text-sm">
            지금 조건으로 검토할 후보가 없어요.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="text-primary mt-2 text-sm font-medium"
          >
            조건 다시 넓히기
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {results.homes.length > 0 && (
            <section aria-label="검토할 집 후보" className="space-y-3">
              <div>
                <h2 className="text-lg font-bold">먼저 볼 집 후보</h2>
                <p className="text-muted-foreground text-xs">
                  현재 조건에서 검토 이유가 큰 후보부터 보여줘요. 전체 {results.homes.length}개는 접어두었습니다.
                </p>
              </div>
              {primaryHomes.map((r) => (
                <RecommendationCard
                  key={r.complex.id}
                  recommendation={r}
                  regionName={regionName.get(r.complex.regionId)}
                  dealType={dealType}
                  action={
                    <CandidateToggleButton id={r.complex.id} kind={r.complex.kind} />
                  }
                />
              ))}
              {extraHomes.length > 0 && (
                <details className="bg-surface-muted rounded-xl p-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    전체 집 후보 보기 ({results.homes.length})
                  </summary>
                  <div className="mt-3 space-y-3">
                    {extraHomes.map((r) => (
                      <RecommendationCard
                        key={r.complex.id}
                        recommendation={r}
                        regionName={regionName.get(r.complex.regionId)}
                        dealType={dealType}
                        action={<CandidateToggleButton id={r.complex.id} kind={r.complex.kind} />}
                      />
                    ))}
                  </div>
                </details>
              )}
            </section>
          )}
          {kind !== "development" && results.areas.length > 0 && (
            <section aria-label="검토할 개발 예정지" className="space-y-3">
              <div>
                <h2 className="text-lg font-bold">
                  검토할 개발 예정지
                </h2>
                <p className="text-muted-foreground text-xs">
                  기다릴지, 주변 선택지를 볼지 판단할 때 확인할 지역이에요.
                </p>
              </div>
              {primaryAreas.map(({ area, fit }) => (
                <AreaCard
                  key={area.id}
                  area={area}
                  fit={fit}
                  action={<CandidateToggleButton id={area.id} kind="area" />}
                />
              ))}
              {extraAreas.length > 0 && (
                <details className="bg-surface-muted rounded-xl p-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    전체 개발 예정지 보기 ({results.areas.length})
                  </summary>
                  <div className="mt-3 space-y-3">
                    {extraAreas.map(({ area, fit }) => (
                      <AreaCard
                        key={area.id}
                        area={area}
                        fit={fit}
                        action={<CandidateToggleButton id={area.id} kind="area" />}
                      />
                    ))}
                  </div>
                </details>
              )}
            </section>
          )}
          {/* 전체 탭: 정비사업 구역 카드(지역 적합도 점수 + 개발 정보) */}
          {kind === "all" && devResults.length > 0 && (
            <section aria-label="정비사업 구역" className="space-y-3">
              <div>
                <h2 className="text-lg font-bold">정비사업 구역</h2>
                <p className="text-muted-foreground text-xs">
                  재개발·재건축 등. 지역 적합도(위치·교통·학군)만 점수이고 세대·분양가 등 개발 성과는 정보예요.
                </p>
              </div>
              {devResults.map((area) => (
                <DevelopmentAreaCard key={area.id} area={area} localFit={localFitOf(area)} />
              ))}
            </section>
          )}

          {/* 개발 호재 탭: 카테고리 chip + 개발예정지(AreaFit) + 정비사업(지역 적합도) */}
          {kind === "development" && (
            <section aria-label="개발 호재" className="space-y-3">
              <div>
                <h2 className="text-lg font-bold">개발 호재</h2>
                <p className="text-muted-foreground text-xs">
                  주변 개발 계획 정보예요. 가격 예측·투자 추천이 아니라 판단 보조. 지역 적합도는 위치·교통·학군 기준(개발 성과 아님).
                </p>
              </div>
              <div role="tablist" aria-label="개발 호재 분류" className="flex flex-wrap gap-1.5">
                {CATALYST_CHIPS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    role="tab"
                    aria-selected={catalystCat === c.value}
                    title={c.tip}
                    onClick={() => setCatalystCat(c.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      catalystCat === c.value ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              {(catalystCat === "all" || catalystCat === "new_town") &&
                results.areas.map(({ area, fit }) => (
                  <AreaCard key={area.id} area={area} fit={fit} action={<CandidateToggleButton id={area.id} kind="area" />} />
                ))}
              {catalystDevs.map((area) => (
                <DevelopmentAreaCard key={area.id} area={area} localFit={localFitOf(area)} />
              ))}
              {(catalystCat === "all" || catalystCat === "new_town" ? results.areas.length : 0) + catalystDevs.length === 0 && (
                <p className="text-muted-foreground text-sm">이 분류에 해당하는 개발 정보가 없어요.</p>
              )}
            </section>
          )}
        </div>
      )}
    </PageContainer>
  );
}

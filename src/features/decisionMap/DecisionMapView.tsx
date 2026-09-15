"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Area, CurrentHousing, Home, Workplace } from "@/domain/types";
import { cn } from "@/lib/utils";
import { useDevelopments, useDevelopmentProperties } from "@/hooks/queries";
import { useManualPropertyStore } from "@/stores/manualPropertyStore";
import { StatusBadge } from "@/features/strategy/StatusBadge";
import {
  KIND_LABEL,
  pickCompareColumns,
  strategyTargetHref,
  type StrategyBoardItem,
} from "@/features/strategy/strategyView";
import { DecisionMap } from "./DecisionMap";
import { RedevelopmentPanel } from "./RedevelopmentPanel";
import { RedevelopmentCostSimulator } from "./RedevelopmentCostSimulator";
import { DevelopmentDetailPanel } from "./DevelopmentDetailPanel";
import { DevelopmentComparison } from "./DevelopmentComparison";
import { ManualPropertyForm } from "./ManualPropertyForm";
import { buildDecisionMapScene } from "./scene";

const propertySourceLabel = (p?: { listing?: { sourceType?: string } }) => {
  const st = p?.listing?.sourceType;
  return st === "broker" ? "현장 확인" : st === "user_input" ? "사용자 입력" : "샘플 데이터";
};

export interface DecisionMapViewProps {
  board: StrategyBoardItem[];
  homes: Home[];
  areas: Area[];
  workplaces: Workplace[];
  currentHousing?: CurrentHousing;
}

/**
 * 지도 + 전략 카드의 양방향 sync 화면. 지도는 spatial explanation layer(primary는 카드).
 * 선택 상태(selectedId)를 한 곳에서 관리 → 카드·지도가 함께 구독. (decision-map.md §4,§7)
 */
export function DecisionMapView({ board, homes, areas, workplaces, currentHousing }: DecisionMapViewProps) {
  // 지도 후보 = kind별 대표 1개(마커 과밀 방지). 카드도 동일 집합.
  const columns = useMemo(() => pickCompareColumns(board), [board]);
  const targetOf = useMemo(() => {
    const m = new Map<string, Home | Area>();
    for (const c of columns) {
      const ref = c.strategy.targetRef;
      if (!ref || ref.kind === "area") {
        const a = ref && areas.find((x) => x.id === ref.id);
        if (a) m.set(c.strategy.id, a);
      } else {
        const h = homes.find((x) => x.id === ref.id);
        if (h) m.set(c.strategy.id, h);
      }
    }
    return m;
  }, [columns, homes, areas]);

  const [selectedId, setSelectedId] = useState<string | undefined>(() => columns[0]?.strategy.id);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | undefined>();
  const [selectedDevelopmentId, setSelectedDevelopmentId] = useState<string | undefined>();
  const selected = columns.find((c) => c.strategy.id === selectedId) ?? columns[0];

  // 개발사업 영역 + 정비사업 매물(빌라 등) — 기존 home/strategy 흐름과 분리된 layer.
  const developmentsData = useDevelopments().data;
  const propertiesData = useDevelopmentProperties().data;
  const manualProperties = useManualPropertyStore((s) => s.properties);
  const addManual = useManualPropertyStore((s) => s.add);
  const removeManual = useManualPropertyStore((s) => s.remove);
  const developments = useMemo(() => developmentsData ?? [], [developmentsData]);
  // 샘플 mock 빌라 + 사용자 수기 입력 매물(현장 확인/사용자).
  const properties = useMemo(() => [...(propertiesData ?? []), ...manualProperties], [propertiesData, manualProperties]);
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
  const selectedPropertyArea = selectedProperty?.redevelopment
    ? developments.find((d) => d.id === selectedProperty.redevelopment!.areaId)
    : undefined;
  // 희망 평형 변경을 수기 매물에 persist(재열람 복원). mock 매물은 저장 대상 아님.
  const persistDesiredSize = (estimateId: string) => {
    const p = manualProperties.find((m) => m.id === selectedPropertyId);
    if (!p?.redevelopment) return;
    addManual({ ...p, redevelopment: { ...p.redevelopment, desiredMemberSaleEstimateId: estimateId } });
  };
  // 매물 선택이 없을 때만 개발구역 단독 선택 상세를 노출(매물이 우선).
  const selectedDevelopment =
    !selectedProperty && selectedDevelopmentId
      ? developments.find((d) => d.id === selectedDevelopmentId)
      : undefined;

  const currentHome = useMemo(() => {
    const ref = currentHousing?.homeRef;
    return ref && ref.kind !== "area" ? homes.find((h) => h.id === ref.id) : undefined;
  }, [currentHousing?.homeRef, homes]);

  const scene = useMemo(() => {
    const selTarget = selected ? targetOf.get(selected.strategy.id) : undefined;
    const others = columns
      .filter((c) => c.strategy.id !== selected?.strategy.id)
      .map((c) => targetOf.get(c.strategy.id))
      .filter((t): t is Home | Area => !!t);
    return buildDecisionMapScene({
      current: currentHousing,
      currentHome,
      workplaces,
      selected,
      selectedTarget: selTarget,
      others,
      developments,
      properties,
      selectedPropertyId,
      selectedDevelopmentId,
    });
  }, [columns, targetOf, selected, currentHousing, currentHome, workplaces, developments, properties, selectedPropertyId, selectedDevelopmentId]);

  // entity(point marker) id → 선택 갱신. "property:*"는 매물(빌라), 그 외는 전략 target.
  const onSelectEntity = (entityId: string) => {
    const id = entityId.slice(entityId.indexOf(":") + 1);
    if (entityId.startsWith("property:")) {
      setSelectedPropertyId(id);
      setSelectedDevelopmentId(undefined);
      return;
    }
    const col = columns.find((c) => c.strategy.targetRef?.id === id);
    if (col) {
      setSelectedId(col.strategy.id);
      setSelectedPropertyId(undefined);
      setSelectedDevelopmentId(undefined);
    }
  };
  // 개발구역 폴리곤 클릭 → 구역 단독 선택(매물/전략과 배타적).
  const onSelectDevelopment = (developmentId: string) => {
    setSelectedDevelopmentId(developmentId);
    setSelectedPropertyId(undefined);
  };
  const selectStrategyCard = (strategyId: string) => {
    setSelectedId(strategyId);
    setSelectedPropertyId(undefined);
    setSelectedDevelopmentId(undefined);
  };

  const selTargetId = selected ? selected.strategy.targetRef?.id : undefined;
  // 개발구역 선택은 폴리곤 강조(scene overlay.selected)로 표현 — point marker 강조 없음.
  const selectedEntityId = selectedPropertyId
    ? `property:${selectedPropertyId}`
    : selectedDevelopment
      ? null
      : selTargetId
        ? `target:${selTargetId}`
        : null;

  // 실 개발사업(재개발) 비교 — 동측/북측 등 2건 이상일 때.
  // 진행 비교는 정보량이 있는(확정 단계) 재개발만, 소수로 제한(표 폭발 방지). 전체는 탐색/상세에서.
  const redevelopmentAreas = developments
    .filter((d) => d.developmentType === "redevelopment" && d.certainty === "confirmed")
    .slice(0, 4);

  return (
    <div className="space-y-4">
    <div className="md:grid md:grid-cols-2 md:gap-4">
      {/* 지도 — 모바일 상단(45vh), 데스크톱 우측 sticky */}
      <div className="md:order-2">
        <DecisionMap
          scene={scene}
          selectedEntityId={selectedEntityId}
          onSelectEntity={onSelectEntity}
          onSelectDevelopment={onSelectDevelopment}
          className="border-border h-[45vh] overflow-hidden rounded-xl border md:sticky md:top-4 md:h-[70vh]"
        />
      </div>

      {/* 카드 — 선택과 동기화 */}
      <div className="mt-3 space-y-2 md:order-1 md:mt-0">
        <p className="text-muted-foreground text-xs" role="status">
          {selectedProperty
            ? `선택: ${selectedProperty.name} · ${propertySourceLabel(selectedProperty)}`
            : selectedDevelopment
              ? `선택: ${selectedDevelopment.name} · 개발구역`
              : selected
                ? `선택: ${selected.strategy.label}`
                : ""}
        </p>

        {/* 저장된 현장 매물(재열람·삭제) */}
        {manualProperties.length > 0 && (
          <div className="border-border rounded-lg border p-2">
            <p className="text-muted-foreground mb-1 text-[11px] font-semibold">저장한 현장 매물</p>
            <ul className="space-y-1">
              {manualProperties.map((p) => (
                <li key={p.id} className="flex items-center gap-2">
                  <button type="button" onClick={() => setSelectedPropertyId(p.id)}
                    className={cn("flex-1 truncate rounded-md px-2 py-1 text-left text-xs", selectedPropertyId === p.id ? "bg-primary/10 text-primary" : "text-foreground")}>
                    {p.name} <span className="text-muted-foreground">· {propertySourceLabel(p)}</span>
                  </button>
                  <button type="button" aria-label={`${p.name} 삭제`} onClick={() => { removeManual(p.id); if (selectedPropertyId === p.id) setSelectedPropertyId(undefined); }}
                    className="text-muted-foreground px-1.5 text-xs">삭제</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 현장 매물 수기 입력 */}
        <ManualPropertyForm onAdded={(id) => setSelectedPropertyId(id)} />

        {/* 재개발 빌라 선택 시: 실거주 + 정비사업 요약 + 비용 시뮬레이터 + 사업상세 */}
        {selectedProperty && (
          <>
            <RedevelopmentPanel home={selectedProperty} area={selectedPropertyArea} />
            {selectedProperty.redevelopment && (
              <RedevelopmentCostSimulator home={selectedProperty} area={selectedPropertyArea} onChangeDesiredSize={persistDesiredSize} />
            )}
            {selectedPropertyArea && <DevelopmentDetailPanel area={selectedPropertyArea} />}
          </>
        )}

        {/* 개발구역 마커 단독 선택 시: 사업 상세만(매물 없이 구역 자체를 열람) */}
        {selectedDevelopment && <DevelopmentDetailPanel area={selectedDevelopment} />}

        {columns.map((c) => {
          const active = !selectedProperty && !selectedDevelopment && c.strategy.id === selected?.strategy.id;
          const href = strategyTargetHref(c.strategy);
          return (
            <div
              key={c.strategy.id}
              className={cn(
                "rounded-xl border p-3",
                active ? "border-primary bg-primary/5" : "border-border bg-surface",
              )}
            >
              <button
                type="button"
                onClick={() => selectStrategyCard(c.strategy.id)}
                aria-pressed={active}
                className="flex w-full items-start gap-2 text-left"
              >
                <span className="bg-surface-muted text-muted-foreground rounded px-1.5 py-0.5 text-[11px] font-medium">
                  {KIND_LABEL[c.strategy.kind]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{c.strategy.label}</span>
                  <StatusBadge status={c.decision.status} />
                </span>
                {c.decision.fit && (
                  <span className="text-muted-foreground shrink-0 text-[11px] tabular-nums">
                    HomeFit {c.decision.fit.totalScore}
                  </span>
                )}
              </button>
              {active && href && (
                <Link href={href} className="text-primary mt-2 inline-block text-xs font-medium">
                  대상 단지 상세 보기 →
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>

    {/* 실 개발사업 진행 비교(동측/북측) */}
    {redevelopmentAreas.length >= 2 && <DevelopmentComparison areas={redevelopmentAreas} />}
    </div>
  );
}

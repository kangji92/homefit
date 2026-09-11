// Decision Map scene 조립 (순수). domain → MapEntity[]/MapRelation[] + boundsTargets.
// visibility rule을 여기 한 곳에 둔다: 현재 집 · 직장 최대 2 · 선택 전략의 target ·
// (선택 시)기타 후보는 dim. 모든 후보를 무조건 뿌리지 않는다. (decision-map.md §3,§4)

import type {
  Area,
  CurrentHousing,
  Home,
  Location,
  Workplace,
} from "@/domain/types";
import type { StrategyBoardItem } from "@/features/strategy/strategyView";
import type { DecisionMapScene, MapEntity, MapRelation } from "./types";

export interface DecisionMapInput {
  current?: CurrentHousing;
  /** homeRef가 매칭된 현재 단지(좌표 보유 시 현재 marker). */
  currentHome?: Home;
  workplaces: Workplace[];
  /** 현재 선택된 전략(decision·comparison 포함). */
  selected?: StrategyBoardItem;
  /** 선택 전략의 target 실객체(좌표 조회용). */
  selectedTarget?: Home | Area;
  /** 맥락용 기타 후보(dim 표시). 무조건 전부 넣지 않는다 — 호출측이 소수만 전달. */
  others?: (Home | Area)[];
}

// 워크플레이스 좌표가 실제로 있는지(기본값 0,0은 미설정으로 간주).
function workplaceLocation(w: Workplace): Location | undefined {
  if (!w.id) return undefined;
  if (w.lat === 0 && w.lng === 0) return undefined;
  return { lat: w.lat, lng: w.lng };
}

function targetKind(t: Home | Area): MapEntity["kind"] {
  if (t.kind === "area") return "area";
  return t.kind === "presale" ? "presale_home" : "existing_home";
}

export function buildDecisionMapScene(input: DecisionMapInput): DecisionMapScene {
  const entities: MapEntity[] = [];
  const relations: MapRelation[] = [];

  // ── 현재 집(있고 좌표 있을 때만) ──
  let currentId: string | undefined;
  if (input.currentHome?.location) {
    currentId = `current:${input.currentHome.id}`;
    entities.push({
      id: currentId,
      kind: "current_home",
      location: input.currentHome.location,
      label: input.current?.regionRef?.label
        ? `현재 · ${input.current.regionRef.label}`
        : "현재 집",
      accuracy: input.currentHome.locationAccuracy,
    });
  }

  // ── 직장 최대 2개(좌표 있는 것만) ──
  const workplaceEntities: MapEntity[] = [];
  for (const w of input.workplaces.slice(0, 2)) {
    const loc = workplaceLocation(w);
    if (!loc) continue;
    const e: MapEntity = { id: `wp:${w.id}`, kind: "workplace", location: loc, label: w.label || "직장" };
    workplaceEntities.push(e);
    entities.push(e);
  }

  // ── 선택 전략의 target ──
  let targetId: string | undefined;
  const target = input.selectedTarget;
  if (target?.location) {
    targetId = `target:${target.id}`;
    entities.push({
      id: targetId,
      kind: targetKind(target),
      location: target.location,
      label: target.name,
      selected: true,
      accuracy: target.locationAccuracy,
      fitScore: input.selected?.decision.fit?.totalScore,
      decisionStatus: input.selected?.decision.status,
    });
  }

  // ── 기타 후보(dim) ──
  for (const o of input.others ?? []) {
    if (!o.location || o.id === target?.id) continue;
    entities.push({
      id: `other:${o.id}`,
      kind: targetKind(o),
      location: o.location,
      label: o.name,
      dimmed: true,
      accuracy: o.locationAccuracy,
    });
  }

  // ── 관계 ──
  // 이동: 현재 → target
  if (currentId && targetId) {
    relations.push({ fromId: currentId, toId: targetId, kind: "move", label: "이동" });
  }
  // 통근: target → 각 직장 (currentHomeComparison 결과 재사용, 재계산 안 함)
  const commuteRows = (input.selected?.comparison?.rows ?? []).filter((r) =>
    r.key.startsWith("commute:"),
  );
  if (targetId) {
    for (const wp of workplaceEntities) {
      const wid = wp.id.slice("wp:".length);
      const row = commuteRows.find((r) => r.key === `commute:${wid}`);
      relations.push({
        fromId: targetId,
        toId: wp.id,
        kind: "commute",
        label: row ? `${row.label} ${row.change ?? ""}`.trim() : undefined,
      });
    }
  }

  return { entities, relations, boundsTargets: entities.map((e) => e.location) };
}

import { describe, it, expect } from "vitest";
import { makeComplex } from "@/domain/__fixtures__";
import type {
  Area,
  CurrentHousing,
  Home,
  PresaleHome,
  StrategyDecision,
  Workplace,
  CurrentHomeComparison,
} from "@/domain/types";
import type { DevelopmentArea } from "@/domain/development";
import type { StrategyBoardItem } from "@/features/strategy/strategyView";
import { buildDecisionMapScene } from "./scene";

const wp = (id: string, label: string, lat = 37.5, lng = 127.0): Workplace => ({ id, label, lat, lng, transport: "transit" });
const homeAt = (id: string, lat: number, lng: number, over: Partial<Home> = {}): Home => ({
  ...makeComplex({ id }),
  location: { lat, lng },
  locationAccuracy: "complex",
  ...over,
} as Home);

function boardItem(
  targetId: string,
  kind: StrategyBoardItem["strategy"]["kind"] = "buy_existing",
  over: Partial<StrategyBoardItem> = {},
): StrategyBoardItem {
  const decision: StrategyDecision = {
    strategyId: `s-${targetId}`, status: "consider", reasons: [],
    fit: { complexId: targetId, passesDealbreakers: true, failedDealbreakers: [], unknownDealbreakers: [], axisScores: { price: 0, commute: 0, education: 0, newness: 0, infrastructure: 0, environment: 0, futurePotential: 0 }, totalScore: 80 },
    affordability: { verdict: "ok" }, timing: { horizon: "now" },
    risk: { flags: [], requiredReviews: [], incompleteInputs: [] }, pros: [], cons: [], nextActions: [],
  };
  return {
    strategy: { id: `s-${targetId}`, kind, label: `${targetId} 전략`, targetRef: { kind: "existing", id: targetId }, steps: [] },
    decision,
    ...over,
  };
}

const current: CurrentHousing = { tenure: "jeonse", regionRef: { id: "anyang", label: "평촌" }, movePreference: "open_to_move" };
const currentHome = homeAt("cur", 37.39, 126.95);

describe("buildDecisionMapScene", () => {
  it("① 현재 집 + 직장 + 선택 target을 scene에 담는다", () => {
    const target = homeAt("t1", 37.34, 126.97);
    const scene = buildDecisionMapScene({
      current, currentHome, workplaces: [wp("me", "내"), wp("sp", "배우자")],
      selected: boardItem("t1"), selectedTarget: target,
    });
    const kinds = scene.entities.map((e) => e.kind).sort();
    expect(kinds).toEqual(["current_home", "existing_home", "workplace", "workplace"].sort());
    expect(scene.entities.find((e) => e.selected)?.id).toBe("target:t1");
    expect(scene.boundsTargets).toHaveLength(4);
  });

  it("② 전략(target) 변경 시 target 엔티티가 교체된다", () => {
    const a = buildDecisionMapScene({ current, currentHome, workplaces: [], selected: boardItem("t1"), selectedTarget: homeAt("t1", 37.34, 126.97) });
    const b = buildDecisionMapScene({ current, currentHome, workplaces: [], selected: boardItem("t2"), selectedTarget: homeAt("t2", 37.30, 127.10) });
    expect(a.entities.find((e) => e.selected)?.id).toBe("target:t1");
    expect(b.entities.find((e) => e.selected)?.id).toBe("target:t2");
  });

  it("③ 관련 없는 기타 후보는 dim으로, target과 중복은 제외", () => {
    const scene = buildDecisionMapScene({
      current, currentHome, workplaces: [], selected: boardItem("t1"), selectedTarget: homeAt("t1", 37.34, 126.97),
      others: [homeAt("t1", 37.34, 126.97), homeAt("o2", 37.31, 127.0)],
    });
    expect(scene.entities.find((e) => e.id === "other:t1")).toBeUndefined(); // target 중복 제외
    expect(scene.entities.find((e) => e.id === "other:o2")?.dimmed).toBe(true);
  });

  it("④ 좌표 없는 대상은 scene에서 제외(degraded)", () => {
    const noLoc = { ...makeComplex({ id: "nl" }) } as Home; // location 없음
    const scene = buildDecisionMapScene({
      current, currentHome: undefined, workplaces: [wp("me", "내", 0, 0)], // 직장 0,0 = 미설정
      selected: boardItem("nl"), selectedTarget: noLoc,
    });
    expect(scene.entities).toHaveLength(0);
    expect(scene.boundsTargets).toHaveLength(0);
  });

  it("⑤ rent_then_apply — 현재 전세 유지 + 미래 target scene", () => {
    const presale = { ...makeComplex({ id: "p1" }), kind: "presale", moveInYear: 2032, location: { lat: 37.52, lng: 127.2 }, locationAccuracy: "area" } as unknown as PresaleHome;
    const scene = buildDecisionMapScene({
      current, currentHome, workplaces: [], selected: boardItem("p1", "rent_then_apply"), selectedTarget: presale,
    });
    expect(scene.entities.find((e) => e.kind === "current_home")).toBeDefined();
    expect(scene.entities.find((e) => e.kind === "presale_home" && e.selected)).toBeDefined();
    expect(scene.relations.some((r) => r.kind === "move" && r.toId === "target:p1")).toBe(true);
  });

  it("⑥ commute delta는 currentHomeComparison을 재사용해 relation label로", () => {
    const comparison: CurrentHomeComparison = {
      hasCurrent: true,
      rows: [{ key: "commute:me", label: "내 통근", current: "38분", candidate: "47분", change: "+9분", direction: "tradeoff" }],
      gains: [], tradeoffs: [],
    };
    const scene = buildDecisionMapScene({
      current, currentHome, workplaces: [wp("me", "내")],
      selected: boardItem("t1", "buy_existing", { comparison }), selectedTarget: homeAt("t1", 37.34, 126.97),
    });
    const rel = scene.relations.find((r) => r.kind === "commute" && r.toId === "wp:me");
    expect(rel?.label).toBe("내 통근 +9분");
  });

  it("⑦ area target", () => {
    const area = { kind: "area", id: "a1", name: "하남 교산", regionId: "hanam", areaMetrics: { plannedInfra: 70, transitPlan: 70, supply: 70, futurePotential: 70, environment: 70 }, location: { lat: 37.52, lng: 127.2 }, locationAccuracy: "area" } as Area;
    const scene = buildDecisionMapScene({ current, currentHome, workplaces: [], selected: boardItem("a1"), selectedTarget: area });
    const t = scene.entities.find((e) => e.selected);
    expect(t?.kind).toBe("area");
    expect(t?.accuracy).toBe("area");
  });

  it("⑧ presale target", () => {
    const presale = { ...makeComplex({ id: "p2" }), kind: "presale", moveInYear: 2030, location: { lat: 37.3, lng: 127.1 }, locationAccuracy: "area" } as unknown as PresaleHome;
    const scene = buildDecisionMapScene({ current, currentHome, workplaces: [], selected: boardItem("p2"), selectedTarget: presale });
    expect(scene.entities.find((e) => e.selected)?.kind).toBe("presale_home");
  });

  it("⑨ accuracy=area/region도 포함하되 tier를 그대로 전달", () => {
    const target = homeAt("t3", 37.34, 126.97, { locationAccuracy: "region" });
    const scene = buildDecisionMapScene({ current, currentHome, workplaces: [], selected: boardItem("t3"), selectedTarget: target });
    expect(scene.entities.find((e) => e.selected)?.accuracy).toBe("region");
  });

  it("⑩ 개발영역 overlay + 재개발 빌라 entity(메타데이터) + 연계", () => {
    const area: DevelopmentArea = { id: "dev-x", name: "동측 재개발", developmentType: "redevelopment", stage: "in_progress", detailStage: "implementation", certainty: "confirmed", geometry: { kind: "polygon", rings: [[{ lat: 37.40, lng: 126.94 }, { lat: 37.41, lng: 126.95 }, { lat: 37.40, lng: 126.95 }]] } };
    const villa = { ...makeComplex({ id: "villa1" }), housingType: "villa", location: { lat: 37.402, lng: 126.945 }, locationAccuracy: "complex", redevelopment: { areaId: "dev-x", inside: true } } as Home;
    const scene = buildDecisionMapScene({
      current, currentHome, workplaces: [],
      developments: [area], properties: [villa], selectedPropertyId: "villa1",
    });
    const pe = scene.entities.find((e) => e.id === "property:villa1")!;
    expect(pe.housingType).toBe("villa");
    expect(pe.inRedevelopment).toBe(true);
    expect(pe.selected).toBe(true);
    expect(scene.developments).toHaveLength(1);
    expect(scene.developments![0].relatedEntityIds).toContain("property:villa1");
    // 개발영역 좌표도 fitBounds 대상에 포함
    expect(scene.boundsTargets.length).toBeGreaterThan(scene.entities.length);
  });
});

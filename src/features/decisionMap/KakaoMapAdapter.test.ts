import { describe, it, expect, vi } from "vitest";
import { KakaoMapAdapter } from "./KakaoMapAdapter";
import type { DecisionMapScene } from "./types";
import type { KakaoMapsApi, KCustomOverlayOptions } from "./kakao-types";

// ── Kakao SDK stub (jsdom) — 실제 SDK 없이 adapter 검증 ──
class FakeLatLng {
  constructor(public lat: number, public lng: number) {}
  getLat() { return this.lat; }
  getLng() { return this.lng; }
}
class FakeBounds {
  pts: FakeLatLng[] = [];
  extend(ll: FakeLatLng) { this.pts.push(ll); }
}
const overlays: { opts: KCustomOverlayOptions; map: unknown }[] = [];
class FakeOverlay {
  map: unknown = null;
  constructor(public opts: KCustomOverlayOptions) { overlays.push(this); }
  setMap(m: unknown) { this.map = m; }
}
const shapes: { opts: unknown; map: unknown; type: "polygon" | "polyline" }[] = [];
class FakePolygon { map: unknown = null; type = "polygon" as const; constructor(public opts: unknown) { shapes.push(this); } setMap(m: unknown) { this.map = m; } }
class FakePolyline { map: unknown = null; type = "polyline" as const; constructor(public opts: unknown) { shapes.push(this); } setMap(m: unknown) { this.map = m; } }
const idle: { handlers: ((...a: unknown[]) => void)[] } = { handlers: [] };
// 도형 click 리스너 추적(polygon/line 클릭 → onDevelopmentClick 검증용).
const clickListeners: { target: unknown; handler: (...a: unknown[]) => void }[] = [];
class FakeMap {
  bounds?: FakeBounds; center?: FakeLatLng; level?: number;
  setBounds(b: FakeBounds) { this.bounds = b; }
  setCenter(c: FakeLatLng) { this.center = c; }
  setLevel(n: number) { this.level = n; }
  getBounds() { return { getSouthWest: () => new FakeLatLng(1, 2), getNorthEast: () => new FakeLatLng(3, 4) }; }
}
function makeApi(): { api: KakaoMapsApi; map: FakeMap } {
  overlays.length = 0;
  shapes.length = 0;
  idle.handlers = [];
  clickListeners.length = 0;
  const map = new FakeMap();
  const api = {
    Map: FakeMap, LatLng: FakeLatLng, LatLngBounds: FakeBounds, CustomOverlay: FakeOverlay,
    Polygon: FakePolygon, Polyline: FakePolyline,
    event: {
      addListener: (t: unknown, type: string, h: (...a: unknown[]) => void) => {
        if (type === "idle") idle.handlers.push(h);
        else if (type === "click") clickListeners.push({ target: t, handler: h });
      },
      removeListener: (t: unknown, type: string, h: (...a: unknown[]) => void) => {
        if (type === "idle") idle.handlers = idle.handlers.filter((x) => x !== h);
        else if (type === "click") {
          const i = clickListeners.findIndex((c) => c.target === t && c.handler === h);
          if (i >= 0) clickListeners.splice(i, 1);
        }
      },
    },
  } as unknown as KakaoMapsApi;
  return { api, map: map as unknown as FakeMap };
}

const scene: DecisionMapScene = {
  entities: [
    { id: "current:c", kind: "current_home", location: { lat: 37.39, lng: 126.95 }, label: "현재" },
    { id: "wp:me", kind: "workplace", location: { lat: 37.5, lng: 127.0 }, label: "내" },
    { id: "target:t1", kind: "existing_home", location: { lat: 37.34, lng: 126.97 }, label: "A", selected: true },
  ],
  relations: [],
  boundsTargets: [{ lat: 37.39, lng: 126.95 }, { lat: 37.5, lng: 127.0 }, { lat: 37.34, lng: 126.97 }],
};

describe("KakaoMapAdapter", () => {
  it("render로 엔티티 수만큼 오버레이를 지도에 올린다(현재+직장+target 동시)", () => {
    const { api, map } = makeApi();
    const a = new KakaoMapAdapter(api, map as never);
    a.render(scene);
    expect(overlays).toHaveLength(3);
    expect(overlays.every((o) => o.map === map)).toBe(true);
  });

  it("마커 클릭 → onEntityClick 핸들러에 entity id 전달", () => {
    const { api, map } = makeApi();
    const a = new KakaoMapAdapter(api, map as never);
    const spy = vi.fn();
    a.onEntityClick(spy);
    a.render(scene);
    const targetEl = overlays.find((o) => o.opts.content.getAttribute("data-entity-id") === "target:t1")!.opts.content;
    targetEl.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(spy).toHaveBeenCalledWith("target:t1");
  });

  it("setSelected가 마커 selected 상태를 갱신한다", () => {
    const { api, map } = makeApi();
    const a = new KakaoMapAdapter(api, map as never);
    a.render(scene);
    a.setSelected("wp:me");
    const el = (id: string) => overlays.find((o) => o.opts.content.getAttribute("data-entity-id") === id)!.opts.content;
    expect(el("wp:me").getAttribute("data-selected")).toBe("true");
    expect(el("target:t1").getAttribute("data-selected")).toBe("false");
  });

  it("fitBounds: 2개↑는 setBounds, 1개는 setCenter+setLevel(과도 zoom 방지)", () => {
    const { api, map } = makeApi();
    const a = new KakaoMapAdapter(api, map as never);
    a.fitBounds([{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }]);
    expect(map.bounds).toBeInstanceOf(FakeBounds);
    const { api: api2, map: map2 } = makeApi();
    new KakaoMapAdapter(api2, map2 as never).fitBounds([{ lat: 1, lng: 2 }]);
    expect(map2.center).toBeDefined();
    expect(map2.level).toBe(6);
  });

  it("onViewportChange가 idle 리스너를 등록하고 viewport를 돌려준다", () => {
    const { api, map } = makeApi();
    const a = new KakaoMapAdapter(api, map as never);
    const spy = vi.fn();
    a.onViewportChange(spy);
    expect(idle.handlers).toHaveLength(1);
    idle.handlers[0]();
    expect(spy).toHaveBeenCalledWith({ swLat: 1, swLng: 2, neLat: 3, neLng: 4 });
  });

  it("개발영역 polygon/line을 그리고, 마커보다 낮은 zIndex(layer ordering)", () => {
    const { api, map } = makeApi();
    const a = new KakaoMapAdapter(api, map as never);
    a.render({
      ...scene,
      developments: [
        { id: "d1", label: "동측", developmentType: "redevelopment", stage: "in_progress", certainty: "confirmed", geometry: { kind: "polygon", rings: [[{ lat: 37.4, lng: 126.94 }, { lat: 37.41, lng: 126.95 }, { lat: 37.4, lng: 126.95 }]] }, relatedEntityIds: [] },
        { id: "d2", label: "월판선", developmentType: "railway", stage: "in_progress", certainty: "confirmed", geometry: { kind: "line", path: [{ lat: 37.39, lng: 126.93 }, { lat: 37.4, lng: 126.95 }] }, relatedEntityIds: [] },
      ],
    });
    expect(shapes).toHaveLength(2);
    expect(shapes.every((s) => s.map === map)).toBe(true);
    const poly = shapes.find((s) => s.type === "polygon")!.opts as { zIndex: number };
    expect(poly.zIndex).toBeLessThan(20); // 마커(CustomOverlay zIndex 20/30)보다 아래
  });

  it("개발구역 polygon/line 클릭 → onDevelopmentClick에 development id 전달(마커 승격 없이)", () => {
    const { api, map } = makeApi();
    const a = new KakaoMapAdapter(api, map as never);
    const spy = vi.fn();
    a.onDevelopmentClick(spy);
    a.render({
      ...scene,
      developments: [
        { id: "d1", label: "동측", developmentType: "redevelopment", stage: "in_progress", certainty: "confirmed", geometry: { kind: "polygon", rings: [[{ lat: 37.4, lng: 126.94 }, { lat: 37.41, lng: 126.95 }, { lat: 37.4, lng: 126.95 }]] }, relatedEntityIds: [] },
        { id: "d2", label: "월판선", developmentType: "railway", stage: "in_progress", certainty: "confirmed", geometry: { kind: "line", path: [{ lat: 37.39, lng: 126.93 }, { lat: 37.4, lng: 126.95 }] }, relatedEntityIds: [] },
      ],
    });
    // 도형마다 click 리스너 1개(내부에서만 등록). 마커 entity로는 승격되지 않는다.
    expect(clickListeners).toHaveLength(2);
    clickListeners[0].handler();
    clickListeners[1].handler();
    expect(spy).toHaveBeenNthCalledWith(1, "d1");
    expect(spy).toHaveBeenNthCalledWith(2, "d2");
  });

  it("selected 구역 폴리곤은 더 강한 stroke로 강조된다", () => {
    const { api, map } = makeApi();
    const a = new KakaoMapAdapter(api, map as never);
    const geometry = { kind: "polygon" as const, rings: [[{ lat: 37.4, lng: 126.94 }, { lat: 37.41, lng: 126.95 }, { lat: 37.4, lng: 126.95 }]] };
    a.render({ ...scene, developments: [{ id: "d1", label: "동측", developmentType: "redevelopment", stage: "in_progress", certainty: "confirmed", geometry, relatedEntityIds: [], selected: true }] });
    const sel = shapes.find((s) => s.type === "polygon")!.opts as { strokeWeight: number };
    expect(sel.strokeWeight).toBe(4);
    const { api: api2, map: map2 } = makeApi();
    new KakaoMapAdapter(api2, map2 as never).render({ ...scene, developments: [{ id: "d1", label: "동측", developmentType: "redevelopment", stage: "in_progress", certainty: "confirmed", geometry, relatedEntityIds: [], selected: false }] });
    const unsel = shapes.find((s) => s.type === "polygon")!.opts as { strokeWeight: number };
    expect(unsel.strokeWeight).toBe(2);
  });

  it("destroy가 오버레이와 idle 리스너를 정리한다(누수 방지)", () => {
    const { api, map } = makeApi();
    const a = new KakaoMapAdapter(api, map as never);
    a.onViewportChange(vi.fn());
    a.render({ ...scene, developments: [{ id: "d1", label: "x", developmentType: "railway", stage: "in_progress", certainty: "confirmed", geometry: { kind: "line", path: [{ lat: 37.39, lng: 126.93 }, { lat: 37.4, lng: 126.95 }] }, relatedEntityIds: [] }] });
    a.destroy();
    expect(overlays.every((o) => o.map === null)).toBe(true);
    expect(shapes.every((s) => s.map === null)).toBe(true);
    expect(idle.handlers).toHaveLength(0);
    expect(clickListeners).toHaveLength(0); // 도형 click 리스너도 정리
  });
});

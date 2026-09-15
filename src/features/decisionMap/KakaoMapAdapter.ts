// MapAdapter의 Kakao 구현. **Kakao 타입은 이 파일 내부에만** 존재한다(kakao-types).
// 마커는 CustomOverlay(HTML) — 카드처럼 커지지 않게 최소 정보만. route polyline은
// "실제 경로" 오해 방지를 위해 지도에 그리지 않는다(관계는 카드/요약에서). (decision-map.md §3,§6)

import type { Location } from "@/domain/types";
import type { DevelopmentCertainty, DevelopmentType } from "@/domain/development";
import type { MapAdapter, MapViewport } from "./MapAdapter";
import type { DecisionMapScene, MapDevelopmentOverlay, MapEntity } from "./types";
import type { KakaoMapsApi, KCustomOverlay, KMap, KShape } from "./kakao-types";

const KIND_DOT: Record<MapEntity["kind"], string> = {
  current_home: "#111827",
  workplace: "#6b7280",
  existing_home: "#2563eb",
  presale_home: "#7c3aed",
  area: "#0d9488",
};
const KIND_TAG: Record<MapEntity["kind"], string> = {
  current_home: "현재",
  workplace: "직장",
  existing_home: "기존",
  presale_home: "분양",
  area: "예정지",
};

function createMarkerElement(e: MapEntity): HTMLElement {
  const el = document.createElement("div");
  el.setAttribute("data-entity-id", e.id);
  el.setAttribute("role", "button");
  el.setAttribute("tabindex", "0");
  el.setAttribute("aria-label", `${KIND_TAG[e.kind]} ${e.label}${e.selected ? " (선택됨)" : ""}`);
  el.style.cssText = [
    "display:inline-flex", "align-items:center", "gap:4px",
    "padding:3px 8px", "border-radius:9999px", "font-size:12px", "font-weight:600",
    "background:#fff", "white-space:nowrap", "cursor:pointer", "transform:translateY(-50%)",
    "box-shadow:0 1px 3px rgba(0,0,0,.25)",
  ].join(";");
  const dot = document.createElement("span");
  dot.style.cssText = `width:8px;height:8px;border-radius:9999px;background:${KIND_DOT[e.kind]}`;
  const text = document.createElement("span");
  text.textContent = e.kind === "current_home" ? "현재" : e.label;
  el.append(dot, text);
  applyMarkerState(el, e, !!e.selected);
  return el;
}

const DEV_COLOR: Record<DevelopmentType, string> = {
  redevelopment: "#f97316",
  reconstruction: "#f59e0b",
  railway: "#0ea5e9",
  new_town: "#10b981",
  other: "#9ca3af",
};
// 확정성 → 시각 강도(확정 진하게, 장기검토 옅게).
const CERTAINTY_STYLE: Record<DevelopmentCertainty, { strokeStyle: string; strokeOpacity: number; fillOpacity: number }> = {
  confirmed: { strokeStyle: "solid", strokeOpacity: 0.85, fillOpacity: 0.15 },
  likely: { strokeStyle: "shortdash", strokeOpacity: 0.6, fillOpacity: 0.08 },
  uncertain: { strokeStyle: "dot", strokeOpacity: 0.4, fillOpacity: 0.04 },
};

function applyMarkerState(el: HTMLElement, e: MapEntity, selected: boolean): void {
  el.setAttribute("data-selected", selected ? "true" : "false");
  el.style.opacity = e.dimmed && !selected ? "0.5" : "1";
  el.style.border = selected ? "2px solid #2563eb" : "1px solid #e5e7eb";
  el.style.zIndex = selected ? "30" : e.dimmed ? "10" : "20";
}

export class KakaoMapAdapter implements MapAdapter {
  private overlays = new Map<string, { overlay: KCustomOverlay; el: HTMLElement; entity: MapEntity; onClick: () => void }>();
  private shapes: { shape: KShape; onClick?: (...a: unknown[]) => void }[] = [];
  private clickHandler?: (entityId: string) => void;
  private developmentClickHandler?: (developmentId: string) => void;
  private idleListener?: (...args: unknown[]) => void;

  constructor(private api: KakaoMapsApi, private map: KMap) {}

  render(scene: DecisionMapScene): void {
    this.clearOverlays();
    // 개발영역(폴리곤/라인)을 먼저 — 마커보다 아래(layer ordering). 마커를 가리지 않게.
    this.renderDevelopments(scene.developments ?? []);
    for (const e of scene.entities) {
      const el = createMarkerElement(e);
      const onClick = () => this.clickHandler?.(e.id);
      el.addEventListener("click", onClick);
      el.addEventListener("keydown", (ev) => {
        if ((ev as KeyboardEvent).key === "Enter" || (ev as KeyboardEvent).key === " ") onClick();
      });
      const overlay = new this.api.CustomOverlay({
        position: new this.api.LatLng(e.location.lat, e.location.lng),
        content: el,
        yAnchor: 1,
        clickable: true,
        zIndex: e.selected ? 3 : e.dimmed ? 1 : 2,
      });
      overlay.setMap(this.map);
      this.overlays.set(e.id, { overlay, el, entity: e, onClick });
    }
  }

  onEntityClick(handler: (entityId: string) => void): void {
    this.clickHandler = handler;
  }

  onDevelopmentClick(handler: (developmentId: string) => void): void {
    this.developmentClickHandler = handler;
  }

  setSelected(entityId: string | null): void {
    for (const [id, o] of this.overlays) applyMarkerState(o.el, o.entity, id === entityId);
  }

  fitBounds(locations: Location[]): void {
    if (locations.length === 0) return;
    // 1개면 과도한 zoom-in 방지: 중심 이동 + 완만한 레벨.
    if (locations.length === 1) {
      this.map.setCenter(new this.api.LatLng(locations[0].lat, locations[0].lng));
      this.map.setLevel(6);
      return;
    }
    const bounds = new this.api.LatLngBounds();
    for (const l of locations) bounds.extend(new this.api.LatLng(l.lat, l.lng));
    this.map.setBounds(bounds);
  }

  onViewportChange(handler: (viewport: MapViewport) => void): void {
    this.idleListener = () => {
      const b = this.map.getBounds();
      const sw = b.getSouthWest();
      const ne = b.getNorthEast();
      handler({ swLat: sw.getLat(), swLng: sw.getLng(), neLat: ne.getLat(), neLng: ne.getLng() });
    };
    this.api.event.addListener(this.map, "idle", this.idleListener);
  }

  /** 오버레이/리스너 정리(누수 방지). 언마운트 시 호출. */
  destroy(): void {
    this.clearOverlays();
    if (this.idleListener) {
      this.api.event.removeListener(this.map, "idle", this.idleListener);
      this.idleListener = undefined;
    }
  }

  private renderDevelopments(devs: MapDevelopmentOverlay[]): void {
    for (const d of devs) {
      const color = DEV_COLOR[d.developmentType];
      const style = CERTAINTY_STYLE[d.certainty];
      // 선택된 구역만 강조. 미선택은 옅은 보조 context(후보 주택/매물 마커가 주 시각 대상).
      const strokeOpacity = d.selected ? Math.min(1, style.strokeOpacity + 0.3) : style.strokeOpacity;
      const fillOpacity = d.selected ? style.fillOpacity + 0.12 : style.fillOpacity;
      let shape: KShape | undefined;
      if (d.geometry.kind === "polygon") {
        const ring = d.geometry.rings[0] ?? [];
        if (ring.length < 3) continue;
        shape = new this.api.Polygon({
          path: ring.map((p) => new this.api.LatLng(p.lat, p.lng)),
          strokeWeight: d.selected ? 4 : 2, strokeColor: color, strokeOpacity,
          strokeStyle: style.strokeStyle, fillColor: color, fillOpacity,
          zIndex: 1, // 마커(CustomOverlay)보다 아래
        });
      } else if (d.geometry.kind === "line") {
        if (d.geometry.path.length < 2) continue;
        shape = new this.api.Polyline({
          path: d.geometry.path.map((p) => new this.api.LatLng(p.lat, p.lng)),
          strokeWeight: d.selected ? 6 : 4, strokeColor: color, strokeOpacity,
          strokeStyle: style.strokeStyle, zIndex: 2,
        });
      }
      // point geometry는 MVP에서 shape 생략(마커 레이어에서 다룸).
      if (!shape) continue;
      shape.setMap(this.map);
      // 폴리곤/라인 클릭 → onDevelopmentClick. Kakao 도형 클릭 리스너는 이 파일 내부에만.
      const onClick = () => this.developmentClickHandler?.(d.id);
      this.api.event.addListener(shape, "click", onClick);
      this.shapes.push({ shape, onClick });
    }
  }

  private clearOverlays(): void {
    for (const o of this.overlays.values()) {
      o.el.removeEventListener("click", o.onClick);
      o.overlay.setMap(null);
    }
    this.overlays.clear();
    for (const s of this.shapes) {
      if (s.onClick) this.api.event.removeListener(s.shape, "click", s.onClick);
      s.shape.setMap(null);
    }
    this.shapes = [];
  }
}

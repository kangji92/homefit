import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { DecisionMapScene } from "./types";
import type { KakaoMapsApi } from "./kakao-types";

const { loaderState } = vi.hoisted(() => ({
  loaderState: { current: { status: "error" } as { status: string; api?: KakaoMapsApi } },
}));
vi.mock("./useKakaoLoader", () => ({ useKakaoLoader: () => loaderState.current }));

import { DecisionMap } from "./DecisionMap";

// 최소 Kakao stub
const created: unknown[] = [];
class FakeLatLng { constructor(public lat: number, public lng: number) {} getLat() { return this.lat; } getLng() { return this.lng; } }
class FakeBounds { extend() {} }
class FakeOverlay { setMap() {} constructor(public opts: unknown) { created.push(opts); } }
class FakeMap { constructor() { created.push("map"); } setBounds() {} setCenter() {} setLevel() {} getBounds() { return { getSouthWest: () => new FakeLatLng(0, 0), getNorthEast: () => new FakeLatLng(0, 0) }; } }
const fakeApi = { Map: FakeMap, LatLng: FakeLatLng, LatLngBounds: FakeBounds, CustomOverlay: FakeOverlay, event: { addListener() {}, removeListener() {} } } as unknown as KakaoMapsApi;

const full: DecisionMapScene = {
  entities: [
    { id: "current:c", kind: "current_home", location: { lat: 37.39, lng: 126.95 }, label: "현재" },
    { id: "target:t1", kind: "existing_home", location: { lat: 37.34, lng: 126.97 }, label: "A", selected: true },
  ],
  relations: [], boundsTargets: [{ lat: 37.39, lng: 126.95 }, { lat: 37.34, lng: 126.97 }],
};
const empty: DecisionMapScene = { entities: [], relations: [], boundsTargets: [] };

beforeEach(() => { created.length = 0; });

describe("DecisionMap", () => {
  it("SDK error면 지도 대신 fallback로 강등", () => {
    loaderState.current = { status: "error" };
    render(<DecisionMap scene={full} />);
    expect(screen.queryByRole("application")).not.toBeInTheDocument();
    expect(screen.getByText(/요약으로 보여드려요/)).toBeInTheDocument();
  });

  it("scene이 비면(위치 없음) fallback", () => {
    loaderState.current = { status: "ready", api: fakeApi };
    render(<DecisionMap scene={empty} />);
    expect(screen.getByText(/표시할 위치 정보가 아직 없어요/)).toBeInTheDocument();
  });

  it("SDK ready + 위치 있으면 Kakao 지도를 만들고 마커를 올린다", () => {
    loaderState.current = { status: "ready", api: fakeApi };
    render(<DecisionMap scene={full} />);
    expect(screen.getByRole("application")).toBeInTheDocument();
    expect(created).toContain("map"); // api.Map 생성
    expect(created.filter((c) => c !== "map")).toHaveLength(2); // 오버레이 2개
  });
});

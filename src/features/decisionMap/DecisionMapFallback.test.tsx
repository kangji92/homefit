import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { DecisionMapScene } from "./types";
import { DecisionMapFallback } from "./DecisionMapFallback";

const scene: DecisionMapScene = {
  entities: [
    { id: "current:cur", kind: "current_home", location: { lat: 37.39, lng: 126.95 }, label: "현재 · 평촌" },
    { id: "target:t1", kind: "existing_home", location: { lat: 37.34, lng: 126.97 }, label: "의왕 A아파트", selected: true, decisionStatus: "consider" },
    { id: "wp:me", kind: "workplace", location: { lat: 37.5, lng: 127.0 }, label: "내" },
  ],
  relations: [
    { fromId: "current:cur", toId: "target:t1", kind: "move", label: "이동" },
    { fromId: "target:t1", toId: "wp:me", kind: "commute", label: "내 통근 +9분" },
  ],
  boundsTargets: [],
};

describe("DecisionMapFallback (degraded)", () => {
  it("가짜 지리 대신 현재→목표·통근 변화 요약을 보여준다", () => {
    render(<DecisionMapFallback scene={scene} />);
    expect(screen.getByText("현재 · 평촌")).toBeInTheDocument();
    expect(screen.getByText("의왕 A아파트")).toBeInTheDocument();
    expect(screen.getByText("· 내 통근 +9분")).toBeInTheDocument();
  });

  it("엔티티가 없으면 안내 문구", () => {
    render(<DecisionMapFallback scene={{ entities: [], relations: [], boundsTargets: [] }} />);
    expect(screen.getByText(/표시할 위치 정보가 아직 없어요/)).toBeInTheDocument();
  });
});

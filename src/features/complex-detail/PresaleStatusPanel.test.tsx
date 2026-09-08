import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MOCK_PRESALES } from "@/data/mock/presales";
import { PresaleStatusPanel } from "./PresaleStatusPanel";

const byId = (id: string) => MOCK_PRESALES.find((p) => p.id === id)!;

describe("PresaleStatusPanel", () => {
  it("전매 가능(tradable·공식근거)이면 🟢 + 분양권 거래 경로 + 프리미엄", () => {
    render(<PresaleStatusPanel home={byId("presale-dongtan-b")} />);
    expect(screen.getByText(/🟢 현재 전매 가능/)).toBeInTheDocument();
    expect(screen.getByText(/분양권 거래 가능/)).toBeInTheDocument();
    expect(screen.getByText("프리미엄")).toBeInTheDocument();
  });

  it("전매제한 중이면 🔴 + 종료 예정일 + 위험 신호", () => {
    render(<PresaleStatusPanel home={byId("presale-geomdan-c")} />);
    expect(screen.getByText(/🔴 전매제한 중/)).toBeInTheDocument();
    expect(screen.getByText(/2027-03-20 종료 예정/)).toBeInTheDocument();
  });

  it("청약 예정(전매정보 없음)이면 ⚪ 확인 필요 + 청약 경로", () => {
    render(<PresaleStatusPanel home={byId("presale-geomdan-a")} />);
    expect(screen.getByText(/⚪ 공식 정보 확인 필요/)).toBeInTheDocument();
    expect(screen.getByText(/청약 가능/)).toBeInTheDocument();
  });

  it("미확정 가격은 '확인 필요'로 표시(0 아님)", () => {
    render(<PresaleStatusPanel home={byId("presale-geomdan-a")} />);
    // 분양권 거래가 없음 → 확인 필요
    expect(screen.getAllByText("— 확인 필요").length).toBeGreaterThan(0);
  });
});

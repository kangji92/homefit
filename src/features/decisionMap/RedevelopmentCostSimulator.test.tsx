import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { makeComplex } from "@/domain/__fixtures__";
import type { Home } from "@/domain/types";
import { RedevelopmentCostSimulator } from "./RedevelopmentCostSimulator";

const won = (manwon: number) => ({ manwon, valueProvenance: "sourced" as const });
const villa = {
  ...makeComplex({ id: "v1", name: "A빌라" }),
  housingType: "villa",
  listing: { askingPrice: won(90000), recentTransactionPrice: won(78000) },
  redevelopment: { areaId: "dev-east", inside: true },
} as Home;

describe("RedevelopmentCostSimulator", () => {
  it("기준 프리셋(비례율 100%)의 전체 총투입액을 계산해 강조한다", () => {
    render(<RedevelopmentCostSimulator home={villa} />);
    // 기준: 매수 9억 + 추가분담금 4억 = 13억 (라이브 값 + 비교표에 복수 등장)
    expect(screen.getByText("예상 전체 총투입액 (기본 + 기타비용)")).toBeInTheDocument();
    expect(screen.getAllByText("13억").length).toBeGreaterThan(0);
  });

  it("비례율을 90%로 바꾸면 즉시 재계산(총투입액↑)", () => {
    render(<RedevelopmentCostSimulator home={villa} />);
    fireEvent.change(screen.getByLabelText("비례율(%)"), { target: { value: "90" } });
    // 권리가액 5.4억 → 추가분담금 4.6억 → 기본 총투입 13.6억
    expect(screen.getAllByText("13.6억").length).toBeGreaterThan(0);
  });

  it("보수적 프리셋 클릭 시 입력이 채워진다", () => {
    render(<RedevelopmentCostSimulator home={villa} />);
    fireEvent.click(screen.getByRole("button", { name: "보수적" }));
    expect((screen.getByLabelText("비례율(%)") as HTMLInputElement).value).toBe("90");
  });

  it("비례율 0 이하면 경고를 표시한다", () => {
    render(<RedevelopmentCostSimulator home={villa} />);
    fireEvent.change(screen.getByLabelText("비례율(%)"), { target: { value: "0" } });
    expect(screen.getByText("0보다 커야 해요")).toBeInTheDocument();
  });

  it("시나리오 비교표(보수/기준/낙관)를 보여준다", () => {
    render(<RedevelopmentCostSimulator home={villa} />);
    const table = screen.getByRole("table");
    expect(within(table).getByText("보수적")).toBeInTheDocument();
    expect(within(table).getByText("낙관적")).toBeInTheDocument();
  });
});

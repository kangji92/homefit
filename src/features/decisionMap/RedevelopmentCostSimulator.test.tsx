import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { makeComplex } from "@/domain/__fixtures__";
import type { Home } from "@/domain/types";
import type { DevelopmentArea } from "@/domain/development";
import { RedevelopmentCostSimulator } from "./RedevelopmentCostSimulator";

const won = (manwon: number) => ({ manwon, valueProvenance: "sourced" as const });
const villa = {
  ...makeComplex({ id: "v1", name: "A빌라" }),
  housingType: "villa",
  listing: { askingPrice: won(93000), recentTransactionPrice: won(78000) },
  redevelopment: { areaId: "dev-east", previousAssetAppraisal: won(70000) },
} as Home;
// 종전자산평가액이 없는 매물(모름 상태 검증용).
const villaNoAppraisal = {
  ...makeComplex({ id: "v2", name: "B빌라" }),
  housingType: "villa",
  listing: { askingPrice: won(93000) },
  redevelopment: { areaId: "dev-east" },
} as Home;
const area: DevelopmentArea = {
  id: "dev-east", name: "동측", developmentType: "redevelopment", stage: "in_progress",
  detailStage: "implementation", certainty: "confirmed", verification: "verified",
  geometry: { kind: "point", at: { lat: 37.4, lng: 126.94 } },
  milestones: [
    { kind: "association", label: "조합설립인가", date: "2023-05-08", status: "confirmed", sourceType: "official", verification: "verified" },
    { kind: "implementation", label: "사업시행계획인가", date: "2026-05-19", status: "confirmed", sourceType: "official", verification: "verified" },
    { kind: "management", label: "관리처분계획인가(목표)", date: "2027", status: "target", sourceType: "official", verification: "verified" },
  ],
  memberSaleEstimates: [
    { id: "east-59", sizeLabel: "59㎡", sourceType: "broker", verification: "unverified" },
    { id: "east-84", sizeLabel: "84㎡", price: { min: won(110000), max: won(115000) }, sourceType: "broker", verification: "unverified" },
  ],
};

describe("RedevelopmentCostSimulator", () => {
  it("비례율이 비어있으면 총투입액은 '계산 전' — 임의 기본값 주입 안 함", () => {
    render(<RedevelopmentCostSimulator home={villa} area={area} />);
    // 종전 7억은 매물에서 seed되지만 비례율은 비어있음(100% 주입 금지) → 권리가액/총투입 미계산.
    expect(screen.getByText(/계산 전 — 아래 값을 입력하면/)).toBeInTheDocument();
    expect(screen.getByText("종전자산평가액과 비례율을 입력해주세요")).toBeInTheDocument();
  });

  it("비례율 입력 시에만 84㎡ 11~11.5억 → 총투입액 13.3~13.8억", () => {
    render(<RedevelopmentCostSimulator home={villa} area={area} />);
    fireEvent.change(screen.getByLabelText("비례율(%)"), { target: { value: "100" } });
    expect(screen.getByText("예상 총투입액 (신축 취득까지)")).toBeInTheDocument();
    expect(screen.getByText("왜 이 금액인가요?")).toBeInTheDocument();
    expect(screen.getAllByText("13.3억 ~ 13.8억").length).toBeGreaterThan(0);
  });

  it("종전자산평가액이 없으면 권리가액 미계산 + 필요한 값 안내", () => {
    render(<RedevelopmentCostSimulator home={villaNoAppraisal} area={area} />);
    fireEvent.change(screen.getByLabelText("비례율(%)"), { target: { value: "100" } });
    // 비례율은 있어도 종전자산이 없으면 권리가액 계산 불가 → 안내.
    expect(screen.getByText("종전자산평가액과 비례율을 입력해주세요")).toBeInTheDocument();
    expect(screen.getByText(/계산 전 — 아래 값을 입력하면/)).toBeInTheDocument();
  });

  it("가격 미확보 평형 선택 시 '예정가 미확보' 안내(직접 입력 유도)", () => {
    render(<RedevelopmentCostSimulator home={villa} area={area} />);
    fireEvent.click(screen.getByRole("button", { name: /59㎡/ }));
    expect(screen.getByText(/예정분양가가 확보되지 않았어요/)).toBeInTheDocument();
  });

  it("가격 있는 평형(미확인 자료) 배지·경고 표시", () => {
    render(<RedevelopmentCostSimulator home={villa} area={area} />);
    expect(screen.getByRole("button", { name: /84㎡/ })).toBeInTheDocument();
    expect(screen.getAllByText(/미확인/).length).toBeGreaterThan(0);
  });

  it("희망 평형 변경 시 onChangeDesiredSize로 상위에 반영(persist)", () => {
    const seen: string[] = [];
    render(<RedevelopmentCostSimulator home={villa} area={area} onChangeDesiredSize={(id) => seen.push(id)} />);
    fireEvent.click(screen.getByRole("button", { name: /59㎡/ }));
    expect(seen).toContain("east-59");
  });

  it("사업단계 provenance는 확정 milestone(사업시행계획인가·공식·확인)에서 오고, 구역 내부 여부와 섞이지 않는다", () => {
    render(<RedevelopmentCostSimulator home={villa} area={area} />);
    // 사업단계 = 실제 확정 milestone(구역 내부/매물 provenance와 독립)
    expect(screen.getByText("사업시행계획인가 · 공식·확인됨")).toBeInTheDocument();
    // 구역 내부 여부는 별도 축 — 수기 매물은 미확인(사업단계 verified를 전파하지 않음)
    expect(screen.getByText("구역 내부 여부")).toBeInTheDocument();
    expect(screen.getByText("미확인")).toBeInTheDocument();
  });

  it("비례율 0 이하 경고", () => {
    render(<RedevelopmentCostSimulator home={villa} area={area} />);
    fireEvent.change(screen.getByLabelText("비례율(%)"), { target: { value: "0" } });
    expect(screen.getByText("0보다 커야 해요")).toBeInTheDocument();
  });
});

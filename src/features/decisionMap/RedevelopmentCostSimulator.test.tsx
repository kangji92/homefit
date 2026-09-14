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
  redevelopment: { areaId: "dev-east", inside: true, previousAssetAppraisal: won(70000) },
} as Home;
const area: DevelopmentArea = {
  id: "dev-east", name: "동측", developmentType: "redevelopment", stage: "in_progress",
  detailStage: "implementation", certainty: "confirmed", geometry: { kind: "point", at: { lat: 37.4, lng: 126.94 } },
  memberSaleEstimates: [
    { sizeLabel: "84㎡", price: { min: won(110000), max: won(115000) }, sourceType: "broker", verification: "unverified" },
  ],
};

describe("RedevelopmentCostSimulator (range)", () => {
  it("84㎡ 11~11.5억 → 총투입액 13.3~13.8억 범위(seed: 종전 7억·비례율 100%)", () => {
    render(<RedevelopmentCostSimulator home={villa} area={area} />);
    expect(screen.getByText("예상 전체 총투입액 (기본 + 기타비용)")).toBeInTheDocument();
    expect(screen.getAllByText("13.3억 ~ 13.8억").length).toBeGreaterThan(0);
  });

  it("연결 사업의 평형별 조합원분양가(미확인) 배지·경고를 표시", () => {
    render(<RedevelopmentCostSimulator home={villa} area={area} />);
    expect(screen.getByRole("button", { name: /84㎡/ })).toBeInTheDocument();
    expect(screen.getByText(/미확인/)).toBeInTheDocument();
  });

  it("비례율 0 이하 경고", () => {
    render(<RedevelopmentCostSimulator home={villa} area={area} />);
    fireEvent.change(screen.getByLabelText("비례율(%)"), { target: { value: "0" } });
    expect(screen.getByText("0보다 커야 해요")).toBeInTheDocument();
  });
});

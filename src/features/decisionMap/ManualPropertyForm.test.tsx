import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { DevelopmentArea } from "@/domain/development";
import { useManualPropertyStore } from "@/stores/manualPropertyStore";
import { ManualPropertyForm } from "./ManualPropertyForm";

const won = (manwon: number) => ({ manwon, valueProvenance: "sourced" as const });
const area: DevelopmentArea = {
  id: "dev-east", name: "동측 재개발", developmentType: "redevelopment", stage: "in_progress",
  detailStage: "implementation", certainty: "confirmed", geometry: { kind: "polygon", rings: [[]] },
  memberSaleEstimates: [
    { id: "east-84", sizeLabel: "84㎡", price: { min: won(110000), max: won(115000) }, sourceType: "broker", verification: "unverified" },
  ],
};
vi.mock("@/hooks/queries", () => ({ useDevelopments: () => ({ data: [area] }) }));

beforeEach(() => {
  localStorage.clear();
  useManualPropertyStore.getState().reset();
});

describe("ManualPropertyForm", () => {
  it("CTA를 열면 Step 1~3 진행형 폼이 나온다", () => {
    render(<ManualPropertyForm />);
    fireEvent.click(screen.getByRole("button", { name: "+ 현장에서 본 매물 분석하기" }));
    expect(screen.getByText("어떤 매물인가요?")).toBeInTheDocument();
    expect(screen.getByText("어떤 정비사업에 포함되나요?")).toBeInTheDocument();
    expect(screen.getByText("권리 정보를 알고 있나요?")).toBeInTheDocument();
  });

  it("사업을 고르면 희망 평형 선택이 나타나고, 저장 시 inside 자동 true 없이 연결된다", () => {
    render(<ManualPropertyForm />);
    fireEvent.click(screen.getByRole("button", { name: "+ 현장에서 본 매물 분석하기" }));
    fireEvent.change(screen.getByPlaceholderText("예: 비산동 A빌라"), { target: { value: "비산동 A빌라" } });
    // 사업 선택 → 희망 평형 노출 (구역 select는 "연결 안 함"이 초기 선택값)
    fireEvent.change(screen.getByDisplayValue("연결 안 함"), { target: { value: "dev-east" } });
    fireEvent.click(screen.getByRole("button", { name: /84㎡/ }));
    fireEvent.click(screen.getByRole("button", { name: "분석 저장" }));

    const saved = useManualPropertyStore.getState().properties;
    expect(saved).toHaveLength(1);
    expect(saved[0].name).toBe("비산동 A빌라");
    expect(saved[0].redevelopment?.areaId).toBe("dev-east");
    // 사업 선택만으로 구역 내부를 단정하지 않는다.
    expect(saved[0].redevelopment?.inside).toBeUndefined();
    // 희망 평형은 id 참조로 저장(분양가 금액 복사 아님).
    expect(saved[0].redevelopment?.desiredMemberSaleEstimateId).toBe("east-84");
  });
});

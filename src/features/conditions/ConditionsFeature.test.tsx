import { beforeEach, describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DEFAULT_CONDITIONS, useConditionsStore } from "@/stores/conditionsStore";
import { ConditionsFeature } from "./ConditionsFeature";

const READY = {
  ...DEFAULT_CONDITIONS,
  maxSalePrice: 100000,
  availableFunds: 50000,
  maxCommuteMinutes: 60,
  workplaces: [
    { id: "gangnam", label: "강남", lat: 0, lng: 0, transport: "transit" as const },
    { id: "pangyo", label: "판교", lat: 0, lng: 0, transport: "car" as const },
  ],
};

beforeEach(() => {
  localStorage.clear();
  useConditionsStore.getState().reset();
  useConditionsStore.setState({
    hasHydrated: true,
    onboardingCompleted: true,
    conditions: READY,
  });
});

describe("ConditionsFeature", () => {
  it("hydration 전에는 로딩을 표시한다", () => {
    useConditionsStore.setState({ hasHydrated: false });
    render(<ConditionsFeature />);
    expect(screen.getByText("불러오는 중…")).toBeInTheDocument();
  });

  it("현재 조건을 폼에 채워 표시한다", () => {
    render(<ConditionsFeature />);
    expect(screen.getByLabelText("최대 매매 예산 (만원)")).toHaveValue(100000);
  });

  it("유효한 값으로 저장하면 store에 반영된다", async () => {
    const user = userEvent.setup();
    render(<ConditionsFeature />);

    const budget = screen.getByLabelText("최대 매매 예산 (만원)");
    await user.clear(budget);
    await user.type(budget, "90000");
    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(useConditionsStore.getState().conditions.maxSalePrice).toBe(90000);
    expect(screen.getByText("저장했어요.")).toBeInTheDocument();
  });

  it("유효하지 않으면 저장하지 않고 에러를 표시한다", async () => {
    const user = userEvent.setup();
    render(<ConditionsFeature />);

    const budget = screen.getByLabelText("최대 매매 예산 (만원)");
    await user.clear(budget);
    await user.type(budget, "0");
    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(screen.getByText("매매 예산은 0보다 커야 해요")).toBeInTheDocument();
    // 저장되지 않아 기존 값 유지
    expect(useConditionsStore.getState().conditions.maxSalePrice).toBe(100000);
  });
});

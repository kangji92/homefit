import { beforeEach, describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useHouseholdStore } from "@/stores/householdStore";
import { ProfileFeature } from "./ProfileFeature";

beforeEach(() => {
  localStorage.clear();
  useHouseholdStore.getState().reset();
  useHouseholdStore.setState({ hasHydrated: true });
});

describe("ProfileFeature", () => {
  it("hydration 전에는 로딩", () => {
    useHouseholdStore.setState({ hasHydrated: false });
    render(<ProfileFeature />);
    expect(screen.getByText("불러오는 중…")).toBeInTheDocument();
  });

  it("입력이 스토어에 반영된다", async () => {
    const user = userEvent.setup();
    render(<ProfileFeature />);
    await user.type(
      screen.getByLabelText("부부합산 월평균 소득 (만원)"),
      "600",
    );
    expect(useHouseholdStore.getState().profile.monthlyIncomeManwon).toBe(600);
  });

  it("법적 혼인 선택 시 혼인 기간 입력이 나타난다", async () => {
    const user = userEvent.setup();
    render(<ProfileFeature />);
    expect(screen.queryByLabelText("혼인 기간 (개월)")).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("혼인 상태"), "married");
    expect(screen.getByLabelText("혼인 기간 (개월)")).toBeInTheDocument();
    expect(useHouseholdStore.getState().profile.maritalStatus).toBe("married");
  });

  it("사실혼 선택 시 안내 문구를 보여준다", async () => {
    const user = userEvent.setup();
    render(<ProfileFeature />);
    await user.selectOptions(screen.getByLabelText("혼인 상태"), "de_facto");
    expect(
      screen.getByText(/사실혼은 신혼부부 특별공급 대상이 아니에요/),
    ).toBeInTheDocument();
  });
});

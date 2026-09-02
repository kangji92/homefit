import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DEFAULT_CONDITIONS,
  useConditionsStore,
} from "@/stores/conditionsStore";
import { OnboardingFeature } from "./OnboardingFeature";

const { replaceMock } = vi.hoisted(() => ({ replaceMock: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

beforeEach(() => {
  localStorage.clear();
  useConditionsStore.getState().reset();
  useConditionsStore.setState({ hasHydrated: true });
  replaceMock.mockClear();
});

const completeWorkplaces = [
  { id: "gangnam", label: "강남", lat: 0, lng: 0, transport: "transit" as const },
  { id: "pangyo", label: "판교", lat: 0, lng: 0, transport: "car" as const },
];

describe("OnboardingFeature", () => {
  it("저장된 스텝에서 재개한다", () => {
    useConditionsStore.setState({
      conditions: {
        ...DEFAULT_CONDITIONS,
        maxBudget: 100000,
        availableFunds: 50000,
        workplaces: completeWorkplaces,
      },
      onboardingStep: 3,
      hasHydrated: true,
    });
    render(<OnboardingFeature />);
    expect(screen.getByRole("heading", { name: "우선순위" })).toBeInTheDocument();
  });

  it("이전 스텝 필수값이 누락되면 앞 스텝으로 보정한다", () => {
    // 저장 스텝은 4지만 예산(step0)이 비어 있음 → 0으로 보정
    useConditionsStore.setState({ onboardingStep: 4, hasHydrated: true });
    render(<OnboardingFeature />);
    expect(screen.getByRole("heading", { name: "예산" })).toBeInTheDocument();
  });

  it("현재 스텝 검증 실패 시 에러를 표시하고 넘어가지 않는다", async () => {
    const user = userEvent.setup();
    render(<OnboardingFeature />); // 기본 maxBudget 0
    await user.click(screen.getByRole("button", { name: "다음" }));
    expect(
      await screen.findByText("예산은 0보다 커야 해요"),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "예산" })).toBeInTheDocument();
  });

  it("persist된 값으로 입력을 복원한다", () => {
    useConditionsStore.setState({
      conditions: { ...DEFAULT_CONDITIONS, maxBudget: 123456 },
      hasHydrated: true,
    });
    render(<OnboardingFeature />);
    expect(screen.getByLabelText("최대 구매 예산 (만원)")).toHaveValue(123456);
  });

  it("모든 스텝을 완료하면 onboardingCompleted 설정 후 / 로 이동한다", async () => {
    const user = userEvent.setup();
    render(<OnboardingFeature />);

    // step0 예산
    const budget = screen.getByLabelText("최대 구매 예산 (만원)");
    await user.clear(budget);
    await user.type(budget, "100000");
    await user.click(screen.getByRole("button", { name: "다음" }));

    // step1 직장·통근
    await user.selectOptions(screen.getByLabelText("직장 A 근무지역"), "gangnam");
    await user.selectOptions(screen.getByLabelText("직장 B 근무지역"), "pangyo");
    await user.click(screen.getByRole("button", { name: "다음" }));

    // step2 평형·가족 (기본값 유효)
    await user.click(screen.getByRole("button", { name: "다음" }));
    // step3 우선순위 (기본값 유효)
    await user.click(screen.getByRole("button", { name: "다음" }));
    // step4 절대조건 → 완료
    await user.click(screen.getByRole("button", { name: "완료" }));

    expect(useConditionsStore.getState().onboardingCompleted).toBe(true);
    expect(replaceMock).toHaveBeenCalledWith("/");
  });
});

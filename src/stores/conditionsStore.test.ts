import { beforeEach, describe, it, expect } from "vitest";
import {
  DEFAULT_CONDITIONS,
  DEFAULT_PRIORITIES,
  useConditionsStore,
} from "./conditionsStore";

beforeEach(() => {
  localStorage.clear();
  useConditionsStore.getState().reset();
  useConditionsStore.setState({ hasHydrated: false });
});

const get = () => useConditionsStore.getState();

describe("conditionsStore", () => {
  it("기본 상태로 초기화된다", () => {
    const s = get();
    expect(s.conditions.maxSalePrice).toBe(0);
    expect(s.conditions.workplaces).toHaveLength(2);
    expect(s.priorities).toEqual(DEFAULT_PRIORITIES);
    expect(s.dealbreakers).toEqual({});
    expect(s.onboardingStep).toBe(0);
    expect(s.onboardingCompleted).toBe(false);
  });

  it("patchConditions는 나머지 필드를 보존하며 병합한다", () => {
    get().patchConditions({ maxSalePrice: 100000 });
    const s = get();
    expect(s.conditions.maxSalePrice).toBe(100000);
    // 병합이므로 다른 필드는 그대로
    expect(s.conditions.workplaces).toHaveLength(2);
    expect(s.conditions.desiredSize).toEqual(DEFAULT_CONDITIONS.desiredSize);
  });

  it("우선순위·절대조건·스텝을 갱신한다", () => {
    get().setPriorities({ ...DEFAULT_PRIORITIES, price: 100 });
    get().setDealbreakers({ maxPrice: 80000 });
    get().setStep(3);
    const s = get();
    expect(s.priorities.price).toBe(100);
    expect(s.dealbreakers.maxPrice).toBe(80000);
    expect(s.onboardingStep).toBe(3);
  });

  it("completeOnboarding은 완료 플래그를 세운다", () => {
    expect(get().onboardingCompleted).toBe(false);
    get().completeOnboarding();
    expect(get().onboardingCompleted).toBe(true);
  });

  it("reset은 기본값으로 되돌린다", () => {
    get().patchConditions({ maxSalePrice: 123456 });
    get().completeOnboarding();
    get().setStep(4);
    get().reset();
    const s = get();
    expect(s.conditions.maxSalePrice).toBe(0);
    expect(s.onboardingCompleted).toBe(false);
    expect(s.onboardingStep).toBe(0);
  });

  it("변경사항을 localStorage에 영속하되 hasHydrated는 저장하지 않는다", () => {
    get().patchConditions({ maxSalePrice: 100000 });
    get().setHasHydrated(true);

    const raw = localStorage.getItem("homefit-conditions");
    expect(raw).not.toBeNull();
    const persisted = JSON.parse(raw!);
    expect(persisted.state.conditions.maxSalePrice).toBe(100000);
    expect(persisted.state).not.toHaveProperty("hasHydrated");
  });

  it("setHasHydrated로 복원 완료를 표시한다", () => {
    expect(get().hasHydrated).toBe(false);
    get().setHasHydrated(true);
    expect(get().hasHydrated).toBe(true);
  });
});

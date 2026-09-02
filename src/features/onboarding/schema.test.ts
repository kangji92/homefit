import { describe, it, expect } from "vitest";
import { DEFAULT_CONDITIONS, DEFAULT_PRIORITIES } from "@/stores/conditionsStore";
import {
  LAST_STEP,
  budgetSchema,
  cleanDealbreakers,
  commuteSchema,
  firstIncompleteStep,
  formToConditions,
  householdSchema,
  prioritySchema,
  resolveResumeStep,
  storeToFormValues,
  type OnboardingFormValues,
} from "./schema";

const completeValues: OnboardingFormValues = {
  maxBudget: 100000,
  availableFunds: 50000,
  workplaceAId: "gangnam",
  workplaceBId: "pangyo",
  transportA: "transit",
  transportB: "car",
  maxCommuteMinutes: 45,
  desiredSizeMin: 25,
  desiredSizeMax: 34,
  childPlan: "undecided",
  moveInTiming: "flexible",
  priorities: { ...DEFAULT_PRIORITIES },
  dealbreakers: {},
};

describe("스텝 스키마", () => {
  it("budget: 예산은 0보다 커야 한다", () => {
    expect(budgetSchema.safeParse(completeValues).success).toBe(true);
    expect(
      budgetSchema.safeParse({ ...completeValues, maxBudget: 0 }).success,
    ).toBe(false);
  });

  it("commute: 근무지역 미선택은 실패", () => {
    expect(commuteSchema.safeParse(completeValues).success).toBe(true);
    expect(
      commuteSchema.safeParse({ ...completeValues, workplaceAId: "" }).success,
    ).toBe(false);
  });

  it("household: 최대 평형은 최소 이상이어야 한다", () => {
    expect(householdSchema.safeParse(completeValues).success).toBe(true);
    expect(
      householdSchema.safeParse({
        ...completeValues,
        desiredSizeMin: 40,
        desiredSizeMax: 30,
      }).success,
    ).toBe(false);
  });

  it("priority: 0 허용, 100 초과 거부", () => {
    const zero = {
      ...completeValues,
      priorities: {
        price: 0,
        commute: 0,
        education: 0,
        newness: 0,
        infrastructure: 0,
        environment: 0,
        futurePotential: 0,
      },
    };
    expect(prioritySchema.safeParse(zero).success).toBe(true);
    const over = {
      ...completeValues,
      priorities: { ...DEFAULT_PRIORITIES, price: 101 },
    };
    expect(prioritySchema.safeParse(over).success).toBe(false);
  });
});

describe("resolveResumeStep", () => {
  it("모든 스텝 완료 시 저장된 스텝에서 재개", () => {
    expect(resolveResumeStep(3, completeValues)).toBe(3);
  });

  it("이전 스텝 필수값 누락 시 가장 앞 미완료 스텝으로 보정", () => {
    const missingBudget = { ...completeValues, maxBudget: 0 };
    expect(resolveResumeStep(4, missingBudget)).toBe(0);

    const missingArea = { ...completeValues, workplaceAId: "" };
    expect(resolveResumeStep(3, missingArea)).toBe(1);
  });

  it("범위를 벗어난 저장 스텝은 clamp된다", () => {
    expect(resolveResumeStep(99, completeValues)).toBe(LAST_STEP);
    expect(resolveResumeStep(-5, completeValues)).toBe(0);
  });

  it("모두 완료면 firstIncompleteStep은 마지막 스텝", () => {
    expect(firstIncompleteStep(completeValues)).toBe(LAST_STEP);
  });
});

describe("매핑", () => {
  it("우선순위 기본값은 모두 50", () => {
    const values = storeToFormValues(DEFAULT_CONDITIONS, DEFAULT_PRIORITIES, {});
    expect(values.priorities.price).toBe(50);
    expect(values.priorities.futurePotential).toBe(50);
  });

  it("formToConditions는 areaId로 workplace를 구성한다", () => {
    const conditions = formToConditions(completeValues);
    expect(conditions.workplaces).toHaveLength(2);
    expect(conditions.workplaces[0].id).toBe("gangnam");
    expect(conditions.workplaces[0].label).toBe("강남");
    expect(conditions.workplaces[1].id).toBe("pangyo");
    expect(conditions.workplaces[1].transport).toBe("car");
  });

  it("cleanDealbreakers는 미입력(undefined)·거짓 값을 제거한다", () => {
    const cleaned = cleanDealbreakers({
      maxPrice: 80000,
      minSizePyeong: undefined,
      requireSchoolNearby: false,
    });
    expect(cleaned).toEqual({ maxPrice: 80000 });

    const withSchool = cleanDealbreakers({ requireSchoolNearby: true });
    expect(withSchool).toEqual({ requireSchoolNearby: true });
  });
});
